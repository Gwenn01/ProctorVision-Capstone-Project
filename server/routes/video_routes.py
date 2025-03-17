from flask import Blueprint, Response, jsonify
import cv2
import mediapipe as mp
import time
import base64

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
    should_capture = False  # Default: No capture

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            nose_tip = face_landmarks.landmark[1]
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)
            left_x = int(left_eye.x * w)
            right_x = int(right_eye.x * w)

            # Detect suspicious behavior
            if nose_y < (h // 2) - 100:
                warning_message = "Looking Up"
            elif nose_y > (h // 2) + 100:
                warning_message = "Looking Down"
            elif left_x > (w // 2) + 110:
                warning_message = "Looking Left"
            elif right_x < (w // 2) - 110:
                warning_message = "Looking Right"

            if warning_message != "Looking Forward":
                should_capture = True

    return warning_message, should_capture

@video_bp.route('/detect_warning')
def detect_warning():
    """Detects head movement and returns warning message with captured frame."""
    success, frame = cap.read()
    if not success:
        return jsonify({"error": "Failed to capture frame"}), 500

    warning_message, should_capture = detect_suspicious_behavior(frame)

    encoded_frame = None
    if should_capture:
        _, buffer = cv2.imencode('.jpg', frame)
        encoded_frame = base64.b64encode(buffer).decode('utf-8')

    return jsonify({"warning": warning_message, "capture": should_capture, "frame": encoded_frame})


@video_bp.route('/video_feed')
def video_feed():
    """Stream webcam feed with head movement detection."""
    def generate_frames():
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            direction_text, _ = detect_suspicious_behavior(frame)
            cv2.putText(frame, direction_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@video_bp.route('/stop_camera', methods=['POST'])
def stop_camera():
    """Stops the webcam stream."""
    global cap
    if cap.isOpened():
        cap.release()
        return jsonify({"message": "Camera stopped successfully"}), 200
    return jsonify({"error": "Camera is already stopped"}), 400
