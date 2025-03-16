from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_jwt_extended import create_access_token, JWTManager
import cv2
import mediapipe as mp
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import time

app = Flask(__name__)

# Enable CORS for API security
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Sample user data (Replace with a database in production)
users = {
    "Admin": {"username": "admin", "password": "admin123", "role": "Admin"},
    "Instructor": {"username": "instructor", "password": "instructor123", "role": "Instructor"},
    "Student": {"username": "student", "password": "student123", "role": "Student"}
}

# Secret key for JWT authentication
app.config["JWT_SECRET_KEY"] = "supersecretkey"  # Change this in production
jwt = JWTManager(app)

# Public API Route
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})

# User Login Route
@app.route("/api/login", methods=["POST"])
def login():
    try:
        if not request.is_json:
            return jsonify({"error": "Unsupported Media Type. Use 'application/json'"}), 415

        req_data = request.get_json()
        username = req_data.get("username")
        password = req_data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        for user_key, user_info in users.items():
            if username == user_info["username"] and password == user_info["password"]:
                access_token = create_access_token(identity=username)
                return jsonify({"username": username, "role": user_info["role"], "token": access_token}), 200

        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Load MobileNetV2 model
model_path = "cheating_detection_model.h5"

# Check if model file exists and load appropriately
if os.path.exists(model_path):
    try:
        model = tf.keras.models.load_model(model_path)  # Load full model
        print("✅ Model loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("Attempting to load weights into a new model structure...")
        try:
            model = tf.keras.applications.MobileNetV2(weights=None, input_shape=(224, 224, 3), classes=2)
            model.load_weights(model_path)  # Load only weights
            print("✅ Weights loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading weights: {e}")
            model = None  # Prevent further crashes
else:
    print(f"❌ Error: Model file '{model_path}' not found. Ensure it is in the correct directory.")
    model = None

# OpenCV Video Capture
cap = cv2.VideoCapture(0)

LOOK_UP_THRESHOLD = 100
LOOK_DOWN_THRESHOLD = 100
LOOK_LEFT_THRESHOLD = 110
LOOK_RIGHT_THRESHOLD = 110

def detect_suspicious_behavior(frame):
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            nose_tip = face_landmarks.landmark[1]  # Nose tip
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)
            left_x = int(left_eye.x * w)
            right_x = int(right_eye.x * w)

            if nose_y < (h // 2) - LOOK_UP_THRESHOLD:
                return "Looking Up"
            elif nose_y > (h // 2) + LOOK_DOWN_THRESHOLD:
                return "Looking Down"
            elif left_x > (w // 2) + LOOK_LEFT_THRESHOLD:
                return "Looking Left"
            elif right_x < (w // 2) - LOOK_RIGHT_THRESHOLD:
                return "Looking Right"

    return "Looking Forward"

@app.route('/video_feed')
def video_feed():
    def generate_frames():
        while True:
            success, frame = cap.read()
            if not success:
                break

            direction_text = detect_suspicious_behavior(frame)
            cv2.putText(frame, direction_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/classify', methods=['POST'])
def classify_image():
    if model is None:
        return jsonify({'error': "Model is not loaded."}), 500

    file = request.files['file']
    image = Image.open(io.BytesIO(file.read()))
    image = cv2.resize(np.array(image), (224, 224)) / 255.0
    image = np.expand_dims(image, axis=0)

    prediction = model.predict(image)
    result = "Cheating" if prediction[0][1] > prediction[0][0] else "Not Cheating"

    return jsonify({'classification': result})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
