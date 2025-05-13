import cv2
import mediapipe as mp

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    camera_status = "Camera OK"
    head_alignment = "Head Centered"

    if not results.multi_face_landmarks:
        camera_status = "⚠ No Face Detected - Check Camera!"
        head_alignment = "Unknown"
    else:
        for landmarks in results.multi_face_landmarks:
            # Get nose tip coordinates
            nose = landmarks.landmark[1]
            nose_x_pixel = int(nose.x * w)

            # Head alignment check based on nose position
            left_threshold = w * 0.35
            right_threshold = w * 0.65

            if nose_x_pixel < left_threshold:
                head_alignment = "Head Too Left"
            elif nose_x_pixel > right_threshold:
                head_alignment = "Head Too Right"
            else:
                head_alignment = "Head Centered"

    # Draw status text
    cv2.putText(frame, f"{camera_status}", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                (0, 0, 255) if "No Face" in camera_status else (0, 255, 0), 2)
    
    cv2.putText(frame, f"{head_alignment}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                (0, 0, 255) if "Too" in head_alignment else (0, 255, 0), 2)

    # Show output
    cv2.imshow("Camera & Head Alignment Checker", frame)

    # Exit with 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
