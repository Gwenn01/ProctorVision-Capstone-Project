import cv2
import mediapipe as mp
import time
from ultralytics import YOLO

# Initialize YOLO model
yolo_model = YOLO("yolov8n.pt")
target_classes = {
    "cell phone": "Phone",
    "laptop": "Laptop",
    "tv": "Monitor/TV",
    "remote": "Remote",
    "mouse": "Mouse",
    "keyboard": "Keyboard",
    "watch": "Smartwatch",
    "tablet": "Tablet"
}

# Initialize MediaPipe modules
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Webcam setup
cap = cv2.VideoCapture(0)
pTime = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    img_h, img_w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # MediaPipe detections
    face_results = face_mesh.process(rgb_frame)
    hand_results = hands.process(rgb_frame)
    detected_devices = []
    gaze_text = "No Face Detected"
    head_position = "Unknown"
    hand_gesture = "None"
    face_detected = False

    # YOLOv8 detection
    yolo_results = yolo_model(frame, verbose=False)
    person_count = 0

    for result in yolo_results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = box.conf[0]
            label = yolo_model.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            if cls_id == 0:
                person_count += 1
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Person {person_count}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            elif label in target_classes and conf > 0.5:
                detected_devices.append(target_classes[label])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"{target_classes[label]} ({conf:.2f})", 
                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # Face and Gaze Detection
    if face_results.multi_face_landmarks:
        face_detected = True
        for landmarks in face_results.multi_face_landmarks:
            # Nose for head position
            nose = landmarks.landmark[1]
            nose_x = int(nose.x * img_w)

            if nose_x < img_w * 0.3:
                head_position = "Looking Left"
            elif nose_x > img_w * 0.7:
                head_position = "Looking Right"
            else:
                head_position = "Looking Forward"

            # Gaze detection
            left_eye = landmarks.landmark[33]
            right_eye = landmarks.landmark[263]
            left_iris = landmarks.landmark[468]
            right_iris = landmarks.landmark[473]

            eye_width = max(right_eye.x - left_eye.x, 0.01)
            iris_offset_x = (left_iris.x - left_eye.x) / eye_width
            gaze_threshold = 0.15

            if iris_offset_x < -gaze_threshold:
                gaze_text = "Looking Left"
            elif iris_offset_x > gaze_threshold:
                gaze_text = "Looking Right"
            else:
                gaze_text = "Looking Forward"

    # Hand Detection
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            wrist = hand_landmarks.landmark[0]
            index_tip = hand_landmarks.landmark[8]
            thumb_tip = hand_landmarks.landmark[4]
            if index_tip.y < 0.3:
                hand_gesture = "Raised Hand"
            elif abs(index_tip.x - thumb_tip.x) < 0.05 and abs(index_tip.y - thumb_tip.y) < 0.05:
                hand_gesture = "Holding Object"

    # Text display
    status_color = (0, 255, 0) if face_detected else (0, 0, 255)
    cv2.putText(frame, f"Face: {'Detected' if face_detected else 'Not Detected'}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
    cv2.putText(frame, f"Gaze: {gaze_text}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
    cv2.putText(frame, f"Head: {head_position}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
    cv2.putText(frame, f"Hand: {hand_gesture}", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
    cv2.putText(frame, f"People Detected: {person_count}", (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    device_text = f"Devices: {', '.join(set(detected_devices))}" if detected_devices else "Devices: None"
    cv2.putText(frame, device_text, (10, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

    # FPS
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, img_h - 10), cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 1)

    # Show the frame
    cv2.imshow("AI-Powered Exam Cheating Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
