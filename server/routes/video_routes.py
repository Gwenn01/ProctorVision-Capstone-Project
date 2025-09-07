from flask import Blueprint, Response, jsonify
import cv2, mediapipe as mp, base64, threading, time
import numpy as np
from collections import deque

video_bp = Blueprint('video', __name__)

# ------------ MediaPipe ------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False, max_num_faces=1, refine_landmarks=True,
    min_detection_confidence=0.6, min_tracking_confidence=0.6
)
mp_draw = mp.solutions.drawing_utils
draw_spec = mp_draw.DrawingSpec(thickness=1, circle_radius=1)

# ------------ Camera state ------------
cap = None
cap_lock = threading.Lock()

def get_cap():
    global cap
    if cap is None or not cap.isOpened():
        cap = cv2.VideoCapture(0)          # server camera
        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    return cap

# ------------ Head pose settings ------------
# 3D model points (rough generic face model in mm)
MODEL_3D = np.array([
    [0.0,    0.0,    0.0],    # Nose tip (1)
    [0.0,  -63.6,  -12.5],    # Chin (152)
    [-43.3, 32.7,  -26.0],    # Left eye outer corner (33)
    [ 43.3, 32.7,  -26.0],    # Right eye outer corner (263)
    [-28.9,-28.9,  -24.1],    # Left mouth corner (61)
    [ 28.9,-28.9,  -24.1],    # Right mouth corner (291)
], dtype=np.float32)

IDX_NOSE = 1
IDX_CHIN = 152
IDX_LE   = 33
IDX_RE   = 263
IDX_LM   = 61
IDX_RM   = 291

# thresholds in degrees
YAW_THRESH_DEG   = 20.0   # left/right
PITCH_THRESH_DEG = 15.0   # up/down
HOLD_FRAMES = 5           # consecutive frames to confirm
THROTTLE_SEC = 3.0        # capture throttle

# smoothing + baseline calibration
yaw_hist   = deque(maxlen=7)
pitch_hist = deque(maxlen=7)
baseline   = {"yaw": None, "pitch": None}
last_capture_ts = 0.0

# overlay control
DRAW_FACE_MESH = True   # set False for raw camera only (no overlay)
# (No labels drawn at all)

def _landmarks_to_2d_points(lms, w, h):
    pts = []
    for idx in [IDX_NOSE, IDX_CHIN, IDX_LE, IDX_RE, IDX_LM, IDX_RM]:
        p = lms[idx]
        pts.append([p.x * w, p.y * h])
    return np.array(pts, dtype=np.float32)

def _yaw_pitch_deg_from_rvec(rvec, R=None):
    if R is None:
        R, _ = cv2.Rodrigues(rvec)
    # Use cv2.RQDecomp3x3 for stable euler in degrees
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(R)
    # angles = (pitch, yaw, roll) in degrees per OpenCV docs
    pitch, yaw, _ = angles
    return float(yaw), float(pitch)

def detect_head_pose(frame):
    """Return yaw_deg, pitch_deg and message ('Looking ...' or 'Forward')."""
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)

    if not res.multi_face_landmarks:
        return None, None, "No Face", None

    lms = res.multi_face_landmarks[0].landmark
    image_pts = _landmarks_to_2d_points(lms, w, h)

    # Camera intrinsics (approx)
    f = w
    cam_mtx = np.array([[f, 0, w/2],
                        [0, f, h/2],
                        [0, 0, 1]], dtype=np.float32)
    dist = np.zeros((4, 1), dtype=np.float32)

    ok, rvec, tvec = cv2.solvePnP(MODEL_3D, image_pts, cam_mtx, dist, flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return None, None, "No Face", res

    yaw_deg, pitch_deg = _yaw_pitch_deg_from_rvec(rvec)

    # push into smoothing buffers
    yaw_hist.append(yaw_deg)
    pitch_hist.append(pitch_deg)
    yaw_s   = float(np.median(yaw_hist))
    pitch_s = float(np.median(pitch_hist))

    # auto-calibrate neutral baseline
    if baseline["yaw"] is None or baseline["pitch"] is None:
        # when close to forward, lock baseline
        if abs(yaw_s) < 8 and abs(pitch_s) < 8:
            baseline["yaw"] = yaw_s
            baseline["pitch"] = pitch_s

    byaw   = baseline["yaw"] if baseline["yaw"] is not None else 0.0
    bpitch = baseline["pitch"] if baseline["pitch"] is not None else 0.0

    yaw_rel   = yaw_s   - byaw
    pitch_rel = pitch_s - bpitch

    # classify with hysteresis over histories
    msg = "Looking Forward"
    if len(yaw_hist) >= HOLD_FRAMES and len(pitch_hist) >= HOLD_FRAMES:
        yaw_big   = abs(yaw_rel)   > YAW_THRESH_DEG
        pitch_big = abs(pitch_rel) > PITCH_THRESH_DEG
        # decide direction
        if yaw_big and abs(yaw_rel) >= abs(pitch_rel):
            msg = "Looking Left" if yaw_rel > 0 else "Looking Right"
        elif pitch_big:
            msg = "Looking Down" if pitch_rel > 0 else "Looking Up"

    return yaw_rel, pitch_rel, msg, res

def detect_suspicious_behavior(frame):
    """Accurate head-pose with smoothing & baseline; returns (message, should_capture, (yaw,pitch))."""
    global last_capture_ts
    yaw, pitch, msg, res = detect_head_pose(frame)

    should_capture = False
    if msg not in ("Looking Forward", "No Face"):
        now = time.time()
        if now - last_capture_ts >= THROTTLE_SEC and len(yaw_hist) >= HOLD_FRAMES:
            # ensure held condition: last HOLD_FRAMES all beyond threshold
            yaws   = list(yaw_hist)[-HOLD_FRAMES:]
            pitchs = list(pitch_hist)[-HOLD_FRAMES:]
            if (all(abs(y - (baseline["yaw"] or 0.0))   > YAW_THRESH_DEG   for y in yaws) or
                all(abs(p - (baseline["pitch"] or 0.0)) > PITCH_THRESH_DEG for p in pitchs)):
                should_capture = True
                last_capture_ts = now

    return msg, should_capture, (yaw, pitch), res

@video_bp.route('/detect_warning')
def detect_warning():
    c = get_cap()
    with cap_lock:
        ok, frame = c.read()
    if not ok:
        return jsonify({"error": "Failed to capture frame"}), 500

    msg, should_capture, (yaw, pitch), _ = detect_suspicious_behavior(frame)

    encoded_frame = None
    if should_capture:
        _, buffer = cv2.imencode('.jpg', frame)
        encoded_frame = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        "warning": msg,
        "capture": should_capture,
        "frame": encoded_frame,
        "yaw_deg": None if yaw is None else round(float(yaw), 2),
        "pitch_deg": None if pitch is None else round(float(pitch), 2),
    })

@video_bp.route('/video_feed')
def video_feed():
    def generate_frames():
        c = get_cap()
        while True:
            with cap_lock:
                ok, frame = c.read()
            if not ok:
                break

            # Run detection (for logging/capture control) but DO NOT draw labels
            msg, _, _, res = detect_suspicious_behavior(frame)

            # Optional: draw only face mesh (no text)
            if DRAW_FACE_MESH and res and res.multi_face_landmarks:
                mp_draw.draw_landmarks(
                    image=frame,
                    landmark_list=res.multi_face_landmarks[0],
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=draw_spec
                )

            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
                   + buffer.tobytes() + b'\r\n')
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@video_bp.route('/stop_camera', methods=['POST'])
def stop_camera():
    global cap
    if cap is not None and cap.isOpened():
        cap.release()
        cap = None
        return jsonify({"message": "Camera stopped successfully"}), 200
    return jsonify({"error": "Camera is already stopped"}), 400
