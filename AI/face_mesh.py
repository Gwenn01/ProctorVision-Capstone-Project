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
direction_text = "Looking Forward"

# Thresholds for more precise head movement detection
LOOK_UP_THRESHOLD = 60
LOOK_DOWN_THRESHOLD = 60
LOOK_LEFT_THRESHOLD = 80
LOOK_RIGHT_THRESHOLD = 80

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape  # Get frame dimensions

    # Convert frame to RGB (MediaPipe requires RGB images)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame with Face Mesh
    results = face_mesh.process(rgb_frame)

    # Draw face mesh landmarks if detected
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(
                frame,
                face_landmarks,
                mp_face_mesh.FACEMESH_TESSELATION,  # Face mesh connections
                draw_specs,  # Default landmark style
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )

            # Extract key facial landmarks
            nose_tip = face_landmarks.landmark[1]  # Nose tip
            
            # Convert normalized coordinates to pixel values
            nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)

            # Head movement detection with stricter thresholds
            if nose_y < (h // 2) - LOOK_UP_THRESHOLD:  
                direction_text = "Looking Up"
            elif nose_y > (h // 2) + LOOK_DOWN_THRESHOLD:  
                direction_text = "Looking Down"
            elif nose_x < (w // 2) - LOOK_LEFT_THRESHOLD:  
                direction_text = "Looking Far Right"
            elif nose_x > (w // 2) + LOOK_RIGHT_THRESHOLD:  
                direction_text = "Looking Far Left"
            else:
                direction_text = "Looking Forward"

            # Display the detected head movement
            cv2.putText(frame, direction_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Display the FPS
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 20), cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 1)

    # Display the frame
    cv2.imshow("Face Mesh Head Movement Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
