# routes/webrtc_routes.py
from flask import Blueprint, request, jsonify
import asyncio, time, traceback, os, threading, base64
from collections import defaultdict, deque
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole
import cv2, numpy as np
import mediapipe as mp

from services.behavior_service import save_behavior_log_async  # save image to DB (async)
from services.instructor_services import increment_suspicious_for_student_async  # bump counter (async)

webrtc_bp = Blueprint("webrtc", __name__)

# -------- logging / config --------
SUMMARY_EVERY_S = float(os.getenv("PROCTOR_SUMMARY_EVERY_S", "1.0"))
RECV_TIMEOUT_S  = float(os.getenv("PROCTOR_RECV_TIMEOUT_S", "5.0"))   # timeout for track.recv
HEARTBEAT_S     = float(os.getenv("PROCTOR_HEARTBEAT_S", "10.0"))     # reader heartbeat log

def log(event, sid="-", eid="-", **kv):
    tail = " ".join(f"{k}={v}" for k, v in kv.items())
    print(f"[{event}] sid={sid} eid={eid} {tail}".strip(), flush=True)

# -------- persistent asyncio loop (aiortc needs this) --------
_loop = asyncio.new_event_loop()
threading.Thread(target=_loop.run_forever, daemon=True).start()
def run_coro(coro):
    return asyncio.run_coroutine_threadsafe(coro, _loop).result()

# -------- global state --------
pcs = set()
last_warning = defaultdict(lambda: {"warning": "Looking Forward", "at": 0})
last_metrics = defaultdict(lambda: {"yaw": None, "pitch": None, "dx": None, "dy": None, "fps": None, "label": "n/a", "at": 0})
last_capture = defaultdict(lambda: {"label": None, "at": 0})

# -------- thresholds (env tunable) --------
# head pose
YAW_DEG_TRIG        = float(os.getenv("PROCTOR_YAW_DEG", "12"))     # left/right
PITCH_DEG_TRIG_UP   = float(os.getenv("PROCTOR_PITCH_UP_DEG", "10")) # up
PITCH_DEG_TRIG_DOWN = float(os.getenv("PROCTOR_PITCH_DOWN_DEG", "16")) # down (less sensitive than before)
DX_TRIG             = float(os.getenv("PROCTOR_DX", "0.06"))
DY_TRIG_UP          = float(os.getenv("PROCTOR_DY_UP", "0.08"))
DY_TRIG_DOWN        = float(os.getenv("PROCTOR_DY_DOWN", "0.10"))     # down (less sensitive)
SMOOTH_N            = int(os.getenv("PROCTOR_SMOOTH_N", "5"))

# capture policy
CAPTURE_MIN_MS        = int(os.getenv("PROCTOR_CAPTURE_MIN_MS", "1200"))
HOLD_FRAMES_HEAD      = int(os.getenv("PROCTOR_HOLD_FRAMES_HEAD", "3"))
HOLD_FRAMES_NOFACE    = int(os.getenv("PROCTOR_HOLD_FRAMES_NOFACE", "3"))
HOLD_FRAMES_HAND      = int(os.getenv("PROCTOR_HOLD_FRAMES_HAND", "5"))  # stricter for hands

# hand filters (reduce sensitivity)
HAND_MIN_BOX_FRAC     = float(os.getenv("PROCTOR_HAND_MIN_BOX_FRAC", "0.025"))  # 2.5% of frame area
HAND_MAX_BOX_FRAC     = float(os.getenv("PROCTOR_HAND_MAX_BOX_FRAC", "0.60"))   # ignore near-full-frame noise
HAND_REQUIRE_LANDMARK = int(os.getenv("PROCTOR_HAND_REQUIRE_LANDMARK", "7"))    # at least N landmarks in-box

# -------- MediaPipe --------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False, max_num_faces=1, refine_landmarks=True,
    min_detection_confidence=0.6, min_tracking_confidence=0.6
)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False, max_num_hands=2,
    min_detection_confidence=0.6, min_tracking_confidence=0.6
)

# FaceMesh indices + 3D model
IDX_NOSE, IDX_CHIN = 1, 152
IDX_LE, IDX_RE     = 263, 33
IDX_LM, IDX_RM     = 291, 61
MODEL_3D = np.array([
    [ 0.0,   0.0,   0.0],
    [ 0.0, -63.6, -12.5],
    [-43.3,  32.7, -26.0],
    [ 43.3,  32.7, -26.0],
    [-28.9, -28.9, -24.1],
    [ 28.9, -28.9, -24.1],
], dtype=np.float32)

def _landmarks_to_pts(lms, w, h):
    ids = [IDX_NOSE, IDX_CHIN, IDX_LE, IDX_RE, IDX_LM, IDX_RM]
    return np.array([[lms[i].x * w, lms[i].y * h] for i in ids], dtype=np.float32)

def _bbox_from_landmarks(lms, w, h, pad=0.03):
    xs = [p.x for p in lms]; ys = [p.y for p in lms]
    x1n, y1n = max(0.0, min(xs) - pad), max(0.0, min(ys) - pad)
    x2n, y2n = min(1.0, max(xs) + pad), min(1.0, max(ys) + pad)
    return (int(x1n*w), int(y1n*h), int(x2n*w), int(y2n*h))

# -------- detector --------
class ProctorDetector:
    def __init__(self):
        self.yaw_hist   = deque(maxlen=SMOOTH_N)
        self.pitch_hist = deque(maxlen=SMOOTH_N)
        self.dx_hist    = deque(maxlen=SMOOTH_N)
        self.dy_hist    = deque(maxlen=SMOOTH_N)
        self.last_print = 0.0
        self.base_yaw = None
        self.base_pitch = None
        self.last_capture_ms = 0

        # streaks for noface / hand capture holds
        self.noface_streak = 0
        self.hand_streak   = 0

    def _update_baseline(self, yaw, pitch):
        alpha = 0.10
        if yaw is not None:
            self.base_yaw = yaw if self.base_yaw is None else (1-alpha)*self.base_yaw + alpha*yaw
        if pitch is not None:
            self.base_pitch = pitch if self.base_pitch is None else (1-alpha)*self.base_pitch + alpha*pitch

    def _pose_angles(self, lms, w, h):
        try:
            pts2d = _landmarks_to_pts(lms, w, h)
            cam = np.array([[w, 0, w/2],
                            [0, w, h/2],
                            [0, 0, 1     ]], dtype=np.float32)
            dist = np.zeros((4,1), dtype=np.float32)
            ok, rvec, _ = cv2.solvePnP(MODEL_3D, pts2d, cam, dist, flags=cv2.SOLVEPNP_ITERATIVE)
            if not ok: return None, None
            R, _ = cv2.Rodrigues(rvec)
            *_, euler = cv2.RQDecomp3x3(R)
            pitch, yaw, _ = map(float, euler)
            return yaw, pitch
        except Exception:
            return None, None

    def detect(self, bgr, sid="-", eid="-"):
        h, w = bgr.shape[:2]
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        res = face_mesh.process(rgb)

        if not res.multi_face_landmarks:
            now = time.time()
            if now - self.last_print >= SUMMARY_EVERY_S:
                log("FRAME", sid, eid, note="no_face")
                self.last_print = now
            return "No Face", None, rgb, None, None, None, None

        lms = res.multi_face_landmarks[0].landmark
        box = _bbox_from_landmarks(lms, w, h, pad=0.03)

        # pixel offsets
        x1, y1, x2, y2 = box
        fw, fh = max(1, x2-x1), max(1, y2-y1)
        cx, cy = x1 + fw/2.0, y1 + fh/2.0
        nose_x, nose_y = lms[IDX_NOSE].x * w, lms[IDX_NOSE].y * h
        dx = (nose_x - cx) / fw   # + right
        dy = (nose_y - cy) / fh   # + down
        self.dx_hist.append(dx); self.dy_hist.append(dy)
        dx_s = float(np.median(self.dx_hist))
        dy_s = float(np.median(self.dy_hist))

        # angles (may be None on some frames)
        yaw, pitch = self._pose_angles(lms, w, h)
        yaw_s = pitch_s = None
        if yaw is not None:
            self.yaw_hist.append(yaw);   yaw_s   = float(np.median(self.yaw_hist))
        if pitch is not None:
            self.pitch_hist.append(pitch); pitch_s = float(np.median(self.pitch_hist))

        # triggers
        yaw_trigger   = (yaw_s is not None and abs(yaw_s) > YAW_DEG_TRIG) or (abs(dx_s) > DX_TRIG)

        # For "Down", require BOTH pitch and DY to exceed higher thresholds
        pitch_down_trigger = (
            (pitch_s is not None and pitch_s > PITCH_DEG_TRIG_DOWN) and
            (dy_s > DY_TRIG_DOWN)
        )
        # For "Up", keep original sensitivity (OR) unless you also want stricter:
        pitch_up_trigger = (
            (pitch_s is not None and -pitch_s > PITCH_DEG_TRIG_UP) or
            (dy_s < -DY_TRIG_UP)
        )

        label = "Looking Forward"
        if yaw_trigger and (abs(dx_s) >= abs(dy_s) or not (pitch_up_trigger or pitch_down_trigger)):
            label = "Looking Right" if dx_s > 0 else "Looking Left"
        elif pitch_down_trigger:
            label = "Looking Down"
        elif pitch_up_trigger:
            label = "Looking Up"

        if label == "Looking Forward":
            self._update_baseline(yaw_s, pitch_s)

        now = time.time()
        if now - self.last_print >= SUMMARY_EVERY_S:
            log("FRAME", sid, eid,
                yaw=f"{yaw_s:.1f}" if yaw_s is not None else "na",
                pitch=f"{pitch_s:.1f}" if pitch_s is not None else "na",
                dx=f"{dx_s:.3f}", dy=f"{dy_s:.3f}", choose=label)
            self.last_print = now

        return label, box, rgb, yaw_s, pitch_s, dx_s, dy_s

    def detect_hands_anywhere(self, rgb):
        """
        Less sensitive hand detection:
        - requires a minimum hand bounding box area vs frame (HAND_MIN_BOX_FRAC)
        - ignores absurdly large boxes (HAND_MAX_BOX_FRAC)
        - returns ('Hand Detected', count) only if at least one qualified hand is present
        """
        h, w = rgb.shape[:2]
        frame_area = float(h * w)
        res = hands.process(rgb)
        if not res.multi_hand_landmarks:
            return None, 0

        qualified = 0
        for hlms in res.multi_hand_landmarks:
            xs = [p.x for p in hlms.landmark]; ys = [p.y for p in hlms.landmark]
            x1 = max(0, int(min(xs) * w)); y1 = max(0, int(min(ys) * h))
            x2 = min(w, int(max(xs) * w)); y2 = min(h, int(max(ys) * h))
            bw, bh = max(1, x2 - x1), max(1, y2 - y1)
            box_area_frac = (bw * bh) / frame_area

            # crude landmark-count-in-box sanity (they all are, but keep option)
            lm_in_box = sum(
                1 for p in hlms.landmark
                if (x1 <= int(p.x * w) <= x2 and y1 <= int(p.y * h) <= y2)
            )

            if HAND_MIN_BOX_FRAC <= box_area_frac <= HAND_MAX_BOX_FRAC and lm_in_box >= HAND_REQUIRE_LANDMARK:
                qualified += 1

        if qualified > 0:
            return "Hand Detected", qualified
        return None, 0

    # capture throttles (shared for all capture kinds)
    def _throttle_ok(self):
        return int(time.time()*1000) - self.last_capture_ms >= CAPTURE_MIN_MS
    def _mark_captured(self):
        self.last_capture_ms = int(time.time()*1000)

    # head (left/right/up/down)
    def should_capture_head(self, head_label, sid="-", eid="-"):
        if head_label in ("Looking Forward", "No Face"):
            return False
        if not self._throttle_ok():
            return False

        # Pixel hold
        pixel_hold_ok = False
        if len(self.dx_hist) >= HOLD_FRAMES_HEAD and len(self.dy_hist) >= HOLD_FRAMES_HEAD:
            dxs = list(self.dx_hist)[-HOLD_FRAMES_HEAD:]
            dys = list(self.dy_hist)[-HOLD_FRAMES_HEAD:]
            if head_label in ("Looking Left", "Looking Right"):
                pixel_hold_ok = all(abs(x) > DX_TRIG for x in dxs)
            elif head_label in ("Looking Up", "Looking Down"):
                # For "Down", mirror the stricter rule: require DY hold above down threshold
                if head_label == "Looking Down":
                    pixel_hold_ok = all(y > DY_TRIG_DOWN for y in dys)
                else:  # Looking Up
                    pixel_hold_ok = all(-y > DY_TRIG_UP for y in dys)
            else:
                pixel_hold_ok = (all(abs(x) > DX_TRIG for x in dxs) or
                                 all(abs(y) > max(DY_TRIG_UP, DY_TRIG_DOWN) for y in dys))

        # Angle hold
        angle_hold_ok = False
        if len(self.yaw_hist) >= HOLD_FRAMES_HEAD and len(self.pitch_hist) >= HOLD_FRAMES_HEAD:
            by = self.base_yaw if self.base_yaw is not None else 0.0
            bp = self.base_pitch if self.base_pitch is not None else 0.0
            recent_yaw   = list(self.yaw_hist)[-HOLD_FRAMES_HEAD:]
            recent_pitch = list(self.pitch_hist)[-HOLD_FRAMES_HEAD:]
            if head_label in ("Looking Left", "Looking Right"):
                angle_hold_ok = all(abs(y - by) > YAW_DEG_TRIG for y in recent_yaw)
            elif head_label == "Looking Down":
                angle_hold_ok = all((p - bp) > PITCH_DEG_TRIG_DOWN for p in recent_pitch)
            elif head_label == "Looking Up":
                angle_hold_ok = all((bp - p) > PITCH_DEG_TRIG_UP for p in recent_pitch)

        ok = pixel_hold_ok or angle_hold_ok
        if ok:
            log("CAPTURE_DECISION_HEAD", sid, eid, label=head_label,
                pixel_hold=pixel_hold_ok, angle_hold=angle_hold_ok,
                hold_frames=HOLD_FRAMES_HEAD, ok=True)
            self._mark_captured()
        return ok

    # no face
    def should_capture_noface(self, sid="-", eid="-"):
        if not self._throttle_ok():
            return False
        ok = self.noface_streak >= HOLD_FRAMES_NOFACE
        if ok:
            log("CAPTURE_DECISION_NOFACE", sid, eid,
                streak=self.noface_streak, hold_frames=HOLD_FRAMES_NOFACE, ok=True)
            self._mark_captured()
        return ok

    # hands
    def should_capture_hand(self, hand_label, sid="-", eid="-"):
        if not hand_label:
            return False
        if not self._throttle_ok():
            return False
        ok = self.hand_streak >= HOLD_FRAMES_HAND
        if ok:
            log("CAPTURE_DECISION_HAND", sid, eid,
                streak=self.hand_streak, hold_frames=HOLD_FRAMES_HAND, ok=True)
            self._mark_captured()
        return ok

detectors = defaultdict(ProctorDetector)

# -------- capture helper --------
def _maybe_capture(student_id: str, exam_id: str, bgr, label: str):
    ok, buf = cv2.imencode(".jpg", bgr)
    if not ok:
        log("CAPTURE_SKIP", student_id, exam_id, reason="encode_failed")
        return

    img_b64 = base64.b64encode(buf).decode("utf-8")
    log("CAPTURE_ENQUEUE", student_id, exam_id, label=label, bytes=len(buf))

    # Save image to DB (async)
    save_behavior_log_async(
        int(student_id), int(exam_id), img_b64, label,
        on_error=lambda e: log("CAPTURE_ERR", student_id, exam_id, err=str(e))
    )

    # bump suspicious counter (async)
    increment_suspicious_for_student_async(int(student_id))

    # update in-memory cache for frontend beep
    ts = int(time.time() * 1000)
    last_capture[(student_id, exam_id)] = {"label": label, "at": ts}
    log("LAST_CAPTURE_SET", student_id, exam_id, label=label, at=ts)

# -------- aiortc helpers --------
async def _wait_ice_complete(pc: RTCPeerConnection):
    if pc.iceGatheringState == "complete":
        return
    done = asyncio.Event()
    @pc.on("icegatheringstatechange")
    def _(_ev=None):
        if pc.iceGatheringState == "complete":
            done.set()
    await asyncio.wait_for(done.wait(), timeout=5.0)

async def handle_offer(data: dict):
    student_id = str(data.get("student_id", "0"))
    exam_id    = str(data.get("exam_id", "0"))
    key = (student_id, exam_id)
    log("OFFER_HANDLE", student_id, exam_id)

    offer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
    pc = RTCPeerConnection()
    pcs.add(pc)
    log("PC_CREATED", student_id, exam_id, pc=id(pc))

    @pc.on("connectionstatechange")
    async def _():
        log("PC_STATE", student_id, exam_id, state=pc.connectionState)
        if pc.connectionState in ("failed", "closed", "disconnected"):
            try:
                await pc.close()
            finally:
                pcs.discard(pc)
                for d in (detectors, last_warning, last_metrics, last_capture):
                    d.pop(key, None)
                log("PC_CLOSED", student_id, exam_id, pc=id(pc))

    @pc.on("track")
    def on_track(track):
        log("TRACK", student_id, exam_id, kind=track.kind)
        if track.kind == "video":
            async def reader():
                det = detectors[key]
                t_fps = time.time(); frames = 0
                last_heartbeat = time.time()

                while True:
                    # --- receive with timeout ---
                    try:
                        frame = await asyncio.wait_for(track.recv(), timeout=RECV_TIMEOUT_S)
                    except asyncio.TimeoutError:
                        # lightweight heartbeat on timeouts
                        now = time.time()
                        if now - last_heartbeat >= HEARTBEAT_S:
                            log("TRACK_RECV_TIMEOUT", student_id, exam_id, timeout_s=RECV_TIMEOUT_S)
                            last_heartbeat = now
                        continue
                    except Exception as e:
                        log("TRACK_RECV_END", student_id, exam_id, err=str(e))
                        break

                    # fps window
                    frames += 1
                    now = time.time()
                    if now - t_fps >= 2.0:
                        fps = frames / max(1e-6, (now - t_fps))
                        lm = last_metrics.get(key, {})
                        lm["fps"] = fps
                        last_metrics[key] = lm
                        log("FPS", student_id, exam_id, fps=f"{fps:.1f}")
                        t_fps = now; frames = 0

                    # --- per-frame detection protected ---
                    try:
                        bgr = frame.to_ndarray(format="bgr24")
                        head_label, face_box, rgb, yaw_s, pitch_s, dx_s, dy_s = det.detect(bgr, sid=student_id, eid=exam_id)
                        hand_label, _ = det.detect_hands_anywhere(rgb)
                    except Exception as e:
                        log("DETECT_ERR", student_id, exam_id, err=str(e))
                        continue

                    # maintain streaks with stricter holds for hand/noface
                    det.noface_streak = det.noface_streak + 1 if head_label == "No Face" else 0
                    det.hand_streak   = det.hand_streak + 1 if hand_label else 0

                    # choose UI label
                    if head_label == "No Face":
                        warn = "No Face (Hand Detected)" if hand_label else "No Face"
                    elif head_label != "Looking Forward":
                        warn = head_label
                    elif hand_label:
                        warn = hand_label
                    else:
                        warn = "Looking Forward"

                    # --- capture priority with holds/throttle ---
                    if head_label == "No Face" and det.should_capture_noface(sid=student_id, eid=exam_id):
                        _maybe_capture(student_id, exam_id, bgr, "No Face")
                    elif head_label not in ("Looking Forward", "No Face") and det.should_capture_head(head_label, sid=student_id, eid=exam_id):
                        _maybe_capture(student_id, exam_id, bgr, head_label)
                    elif hand_label and det.should_capture_hand(hand_label, sid=student_id, eid=exam_id):
                        _maybe_capture(student_id, exam_id, bgr, "Hand Detected")

                    ts = int(time.time() * 1000)
                    last_warning[key] = {"warning": warn, "at": ts}
                    last_metrics[key] = {
                        "yaw": yaw_s, "pitch": pitch_s, "dx": dx_s, "dy": dy_s,
                        "fps": last_metrics.get(key, {}).get("fps"), "label": warn, "at": ts
                    }

                    # reader heartbeat (when frames flow)
                    if now - last_heartbeat >= HEARTBEAT_S:
                        log("READER_ALIVE", student_id, exam_id, label=warn)
                        last_heartbeat = now

            asyncio.ensure_future(reader(), loop=_loop)
        else:
            MediaBlackhole().addTrack(track)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await _wait_ice_complete(pc)
    log("ICE_DONE", student_id, exam_id)
    return pc.localDescription

# -------- routes --------
@webrtc_bp.route("/webrtc/offer", methods=["POST"])
def webrtc_offer():
    try:
        data = request.get_json(force=True)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    sid = str(data.get("student_id", "0")); eid = str(data.get("exam_id", "0"))
    log("OFFER_RX", sid, eid)
    try:
        desc = run_coro(handle_offer(data))
    except Exception as e:
        traceback.print_exc()
        log("OFFER_ERR", sid, eid, err=str(e))
        return jsonify({"error": str(e)}), 500
    log("ANSWER_TX", sid, eid)
    return jsonify({"sdp": desc.sdp, "type": desc.type})

@webrtc_bp.route("/webrtc/cleanup", methods=["POST"])
def webrtc_cleanup():
    async def _close_all():
        for pc in list(pcs):
            try:
                await pc.close()
            finally:
                pcs.discard(pc)
    run_coro(_close_all())
    print("[CLEANUP] closed all RTCPeerConnections", flush=True)
    return jsonify({"ok": True})

@webrtc_bp.route("/proctor/last_warning")
def proctor_last_warning():
    student_id = request.args.get("student_id")
    exam_id = request.args.get("exam_id")
    if not student_id or not exam_id:
        return jsonify(error="missing student_id or exam_id"), 400
    return jsonify(last_warning.get((student_id, exam_id), {"warning": "Looking Forward", "at": 0}))

@webrtc_bp.route("/proctor/last_capture")
def proctor_last_capture():
    student_id = request.args.get("student_id")
    exam_id = request.args.get("exam_id")
    if not student_id or not exam_id:
        return jsonify(error="missing student_id or exam_id"), 400
    return jsonify(last_capture.get((student_id, exam_id), {"label": None, "at": 0}))

@webrtc_bp.route("/proctor/metrics")
def proctor_metrics():
    student_id = request.args.get("student_id")
    exam_id = request.args.get("exam_id")
    if not student_id or not exam_id:
        return jsonify(error="missing student_id or exam_id"), 400
    return jsonify(last_metrics.get((student_id, exam_id), {}))
