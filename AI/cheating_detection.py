import cv2
import mediapipe as mp
import time
import os
import numpy as np
import tensorflow as tf

# Load MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Initialize drawing utils
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
draw_specs = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

# Create directory to save images
save_dir = "captured_frames"
os.makedirs(save_dir, exist_ok=True)

# Load the trained MobileNetV2 model
model = tf.keras.models.load_model("cheating_detection_model.h5")

# Function to classify an image using MobileNetV2
def detect_cheating(image_path):
    """
    Loads an image, preprocesses it, and uses MobileNetV2 to classify it as 'Cheating' or 'Not Cheating'.
    """
    image = cv2.imread(image_path)
    image = cv2.resize(image, (224, 224))  # Resize to MobileNetV2 input size
    image = np.array(image) / 255.0  # Normalize
    image = np.expand_dims(image, axis=0)  # Add batch dimension

    # Predict using the model
    prediction = model.predict(image)
    cheating_label = "Cheating" if prediction[0][1] > prediction[0][0] else "Not Cheating"

    return cheating_label

# Open webcam
cap = cv2.VideoCapture(0)
pTime = 0
direction_text = "Looking Forward"

# Head movement thresholds
LOOK_UP_THRESHOLD = 100
LOOK_DOWN_THRESHOLD = 100
LOOK_LEFT_THRESHOLD = 110
LOOK_RIGHT_THRESHOLD = 110

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape

    # Convert frame to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame with MediaPipe
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Draw face landmarks
            mp_drawing.draw_landmarks(
                frame,
                face_landmarks,
                mp_face_mesh.FACEMESH_TESSELATION,
                draw_specs,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )

            # Extract key points
            nose_tip = face_landmarks.landmark[1]
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            # Convert to pixel coordinates
            nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)
            left_x = int(left_eye.x * w)
            right_x = int(right_eye.x * w)

            # Detect head movement
            if nose_y < (h // 2) - LOOK_UP_THRESHOLD:
                direction_text = "Looking Up"
            elif nose_y > (h // 2) + LOOK_DOWN_THRESHOLD:
                direction_text = "Looking Down"
            elif left_x > (w // 2) + LOOK_LEFT_THRESHOLD:
                direction_text = "Looking Left"
            elif right_x < (w // 2) - LOOK_RIGHT_THRESHOLD:
                direction_text = "Looking Right"
            else:
                direction_text = "Looking Forward"

            # Save and classify image if suspicious head movement is detected
            if direction_text in ["Looking Left", "Looking Right"]:
                timestamp = int(time.time())
                file_path = os.path.join(save_dir, f"{direction_text}_{timestamp}.jpg")
                cv2.imwrite(file_path, frame)
                print(f"Captured and saved: {file_path}")

                # Classify the image using MobileNetV2
                cheating_result = detect_cheating(file_path)
                print(f"Cheating Detection Result: {cheating_result}")

                # Display classification result on screen
                cv2.putText(frame, f"Cheating: {cheating_result}", (10, 100),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            # Display head movement text
            cv2.putText(frame, direction_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Display FPS
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 20), cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 1)

    # Show the frame
    cv2.imshow("Face Mesh Head Movement Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
