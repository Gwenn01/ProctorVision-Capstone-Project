import cv2
import dlib
import numpy as np

# Load pre-trained face detector and facial landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Define 3D model points (nose, eyes, chin) for head pose estimation
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),  # Nose tip
    (0.0, -330.0, -65.0),  # Chin
    (-225.0, 170.0, -135.0),  # Left eye left corner
    (225.0, 170.0, -135.0),  # Right eye right corner
    (-150.0, -150.0, -125.0),  # Left mouth corner
    (150.0, -150.0, -125.0)  # Right mouth corner
], dtype="double")

# Camera matrix (assuming a standard webcam)
FOCAL_LENGTH = 1  # Approximate
CAMERA_MATRIX = np.array([
    [FOCAL_LENGTH, 0, 0],
    [0, FOCAL_LENGTH, 0],
    [0, 0, 1]
], dtype="double")

cap = cv2.VideoCapture(0)  # Open webcam

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:
        # Detect facial landmarks
        landmarks = predictor(gray, face)
        image_points = np.array([
            (landmarks.part(30).x, landmarks.part(30).y),  # Nose tip
            (landmarks.part(8).x, landmarks.part(8).y),  # Chin
            (landmarks.part(36).x, landmarks.part(36).y),  # Left eye left corner
            (landmarks.part(45).x, landmarks.part(45).y),  # Right eye right corner
            (landmarks.part(48).x, landmarks.part(48).y),  # Left mouth corner
            (landmarks.part(54).x, landmarks.part(54).y)  # Right mouth corner
        ], dtype="double")

        # Solve PnP to get rotation vector (head pose estimation)
        success, rotation_vector, translation_vector = cv2.solvePnP(MODEL_POINTS, image_points, CAMERA_MATRIX, None)

        # Convert rotation vector to angles
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_matrix)

        yaw = angles[1]  # Left (-) or right (+)
        pitch = angles[0]  # Up (-) or down (+)

        # Determine head direction
        if yaw < -10:
            direction = "Looking Left"
        elif yaw > 10:
            direction = "Looking Right"
        elif pitch < -10:
            direction = "Looking Up"
        elif pitch > 10:
            direction = "Looking Down"
        else:
            direction = "Looking Forward"

        # Display direction on screen
        cv2.putText(frame, direction, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Head Pose Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
