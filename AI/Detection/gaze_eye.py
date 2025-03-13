import cv2
import mediapipe as mp
import time

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Initialize drawing utils
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
draw_specs = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

# Open the webcam
cap = cv2.VideoCapture(0)

pTime = 0
gaze_text = "Looking Forward"

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape  # Get frame dimensions

    # Convert frame to RGB (MediaPipe requires RGB images)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame with Face Mesh
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Draw eye landmarks
            mp_drawing.draw_landmarks(
                frame, face_landmarks, 
                mp_face_mesh.FACEMESH_CONTOURS, 
                draw_specs, 
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
            )

            # Extract key eye landmarks
            left_eye = face_landmarks.landmark[33]  # Left eye center
            right_eye = face_landmarks.landmark[263]  # Right eye center
            left_iris = face_landmarks.landmark[468]  # Left iris
            right_iris = face_landmarks.landmark[473]  # Right iris

            # Convert normalized coordinates to pixel values
            left_eye_x, left_eye_y = int(left_eye.x * w), int(left_eye.y * h)
            right_eye_x, right_eye_y = int(right_eye.x * w), int(right_eye.y * h)
            left_iris_x, left_iris_y = int(left_iris.x * w), int(left_iris.y * h)
            right_iris_x, right_iris_y = int(right_iris.x * w), int(right_iris.y * h)

            # Compute eye width and height dynamically
            eye_width = max(right_eye_x - left_eye_x, 1)  # Avoid zero division
            eye_height = max(abs(left_eye_y - right_eye_y), 1)  # Prevent zero division

            # Normalize iris movement relative to eye width & height
            left_gaze_offset_x = (left_iris_x - left_eye_x) / eye_width
            right_gaze_offset_x = (right_iris_x - right_eye_x) / eye_width
            left_gaze_offset_y = (left_iris_y - left_eye_y) / eye_height
            right_gaze_offset_y = (right_iris_y - right_eye_y) / eye_height

            # Define dynamic thresholds for gaze detection
            gaze_threshold_x = 0.25  # 25% of eye width
            gaze_threshold_y = 0.25  # 25% of eye height

            # **Detect Eye Gaze Direction**
            if left_gaze_offset_x < -gaze_threshold_x and right_gaze_offset_x < -gaze_threshold_x:
                gaze_text = "Looking Left"
            elif left_gaze_offset_x > gaze_threshold_x and right_gaze_offset_x > gaze_threshold_x:
                gaze_text = "Looking Right"
            elif left_gaze_offset_y < -gaze_threshold_y and right_gaze_offset_y < -gaze_threshold_y:
                gaze_text = "Looking Up"
            elif left_gaze_offset_y > gaze_threshold_y and right_gaze_offset_y > gaze_threshold_y:
                gaze_text = "Looking Down"
            else:
                gaze_text = "Looking Forward"

            # **Display the detected gaze direction**
            cv2.putText(frame, gaze_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Display FPS
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 20), cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 1)

    # Display the frame
    cv2.imshow("Accurate Eye Gaze Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
