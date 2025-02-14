import cv2
import mediapipe as mp
import time

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh  # Additional check for facial landmarks
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.75)
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Open the webcam
cap = cv2.VideoCapture(0)

pTime = 0
face_status = "No Face Detected"

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape  # Get frame dimensions

    # Convert frame to RGB (MediaPipe requires RGB images)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame with Face Detection and Face Mesh
    face_results = face_detection.process(rgb_frame)
    mesh_results = face_mesh.process(rgb_frame)

    face_detected = False

    if face_results.detections:
        for detection in face_results.detections:
            bboxC = detection.location_data.relative_bounding_box
            x, y, w_box, h_box = int(bboxC.xmin * w), int(bboxC.ymin * h), \
                                 int(bboxC.width * w), int(bboxC.height * h)

            # Additional check: Validate with Face Mesh (Landmarks Detection)
            if mesh_results.multi_face_landmarks:  # Ensure facial features are detected
                face_detected = True
                face_status = "Real Face Detected"

                # Draw a rectangle around the detected face
                cv2.rectangle(frame, (x, y), (x + w_box, y + h_box), (0, 255, 0), 2)

    if not face_detected:
        face_status = "No Face Detected / Camera Covered!"

    # **Display the face detection status**
    cv2.putText(frame, face_status, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255) if "No Face" in face_status else (0, 255, 0), 2)

    # Display FPS
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 20), cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 1)

    # Display the frame
    cv2.imshow("Accurate Face Detection & Camera Obstruction Alert", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
