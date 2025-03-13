import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO

# Load YOLOv8 model (Ensure you have yolov8n.pt)
model = YOLO("yolov8n.pt")

# Initialize MediaPipe
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

# Start video capture
cap = cv2.VideoCapture(0)

# Initialize face and hand detector
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5)
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img_h, img_w, _ = frame.shape

    # Process face and hand detection
    face_results = face_mesh.process(rgb_frame)
    hand_results = hands.process(rgb_frame)

    # Multi-Person Detection using YOLO
    yolo_results = model(frame)  # Run YOLOv8 on the frame

    num_people_detected = 0  # Count number of people in the frame

    for r in yolo_results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            confidence = box.conf[0]
            class_id = int(box.cls[0])

            # Check if detected class is a "Person" (COCO dataset: class_id=0 is "person")
            if class_id == 0:
                num_people_detected += 1
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Person {num_people_detected}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Display Multi-Person detection count
    cv2.putText(frame, f"People Detected: {num_people_detected}", (50, 150), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    # Detect head movement
    if face_results.multi_face_landmarks:
        for face_landmarks in face_results.multi_face_landmarks:
            nose = face_landmarks.landmark[1]  # Nose landmark
            x_nose, y_nose = int(nose.x * img_w), int(nose.y * img_h)

            if x_nose < img_w * 0.3:
                head_position = "Looking Left"
            elif x_nose > img_w * 0.7:
                head_position = "Looking Right"
            else:
                head_position = "Looking Forward"

            cv2.putText(frame, f"Head: {head_position}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Detect hand movement and gestures
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Get key points for gesture analysis
            wrist = hand_landmarks.landmark[0]  # Wrist
            index_finger_tip = hand_landmarks.landmark[8]  # Index finger tip
            thumb_tip = hand_landmarks.landmark[4]  # Thumb tip

            # Convert to pixel coordinates
            wrist_x, wrist_y = int(wrist.x * img_w), int(wrist.y * img_h)
            index_x, index_y = int(index_finger_tip.x * img_w), int(index_finger_tip.y * img_h)
            thumb_x, thumb_y = int(thumb_tip.x * img_w), int(thumb_tip.y * img_h)

            # Check if hand is raised (index finger above a threshold)
            if index_y < img_h * 0.3:
                hand_gesture = "Raised Hand"
            elif abs(index_x - thumb_x) < 30 and abs(index_y - thumb_y) < 30:
                hand_gesture = "Holding Object (Possible Phone)"
            else:
                hand_gesture = "Normal Hand Movement"

            cv2.putText(frame, f"Hand: {hand_gesture}", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Display result
    cv2.imshow("Exam Proctoring System", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
