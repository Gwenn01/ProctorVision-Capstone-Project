from flask import Blueprint, Response, jsonify
import cv2
import mediapipe as mp
import time

video_bp = Blueprint('video', __name__)

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

cap = cv2.VideoCapture(0)  # Open webcam

LOOK_UP_THRESHOLD = 100
LOOK_DOWN_THRESHOLD = 100
LOOK_LEFT_THRESHOLD = 110
LOOK_RIGHT_THRESHOLD = 110

last_capture_time = 0
capture_interval = 5  # Capture every 5 seconds (to prevent multiple captures)

def detect_suspicious_behavior(frame):
    """Detect head movement and return warning message with capture flag."""
    global last_capture_time
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    warning_message = "Looking Forward"
    should_capture = False

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            nose_tip = face_landmarks.landmark[1]
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)
            left_x = int(left_eye.x * w)
            right_x = int(right_eye.x * w)

            current_time = time.time()

            if nose_y < (h // 2) - LOOK_UP_THRESHOLD:
                warning_message = "Looking Up"
            elif nose_y > (h // 2) + LOOK_DOWN_THRESHOLD:
                warning_message = "Looking Down"
            elif left_x > (w // 2) + LOOK_LEFT_THRESHOLD:
                warning_message = "Looking Left"
            elif right_x < (w // 2) - LOOK_RIGHT_THRESHOLD:
                warning_message = "Looking Right"

            # Capture only if enough time has passed
            if warning_message != "Looking Forward" and (current_time - last_capture_time) > capture_interval:
                last_capture_time = current_time
                should_capture = True

    return warning_message, should_capture

@video_bp.route('/video_feed')
def video_feed():
    """Stream webcam feed with head movement detection."""
    def generate_frames():
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            direction_text, should_capture = detect_suspicious_behavior(frame)
            cv2.putText(frame, direction_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@video_bp.route('/detect_warning')
def detect_warning():
    """Detects head movement and returns warning message with capture flag."""
    if not cap.isOpened():
        return jsonify({"error": "Camera not available"}), 500

    success, frame = cap.read()
    if not success or frame is None:
        return jsonify({"error": "Failed to capture frame"}), 500

    warning_message, should_capture = detect_suspicious_behavior(frame)
    return jsonify({"warning": warning_message, "capture": should_capture})

@video_bp.route('/stop_camera', methods=['POST'])
def stop_camera():
    """Stops the webcam stream."""
    global cap
    if cap.isOpened():
        cap.release()
        return jsonify({"message": "Camera stopped successfully"}), 200
    return jsonify({"error": "Camera is already stopped"}), 400

# Properly close camera when Flask shuts down
@video_bp.route('/shutdown', methods=['POST'])
def shutdown():
    """Gracefully shutdown Flask and release camera."""
    global cap
    if cap.isOpened():
        cap.release()
    return jsonify({"message": "Server shutting down"}), 200
