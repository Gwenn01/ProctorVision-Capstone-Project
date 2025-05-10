import os
import base64
from flask import Blueprint, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io

from database.connection import get_db_connection

classification_bp = Blueprint('classification_bp', __name__)

# Load the cheating detection model
model_path = "cheating_detection_model.h5"

if os.path.exists(model_path):
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully.")
else:
    model = None
    print(f"Error: Model file '{model_path}' not found.")


# Route 1: Manual classification for uploaded files
@classification_bp.route('/classify_multiple', methods=['POST'])
def classify_multiple():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

    if 'files' not in request.files or len(request.files.getlist('files')) == 0:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist('files')
    results = []

    for file in files:
        try:
            image = Image.open(io.BytesIO(file.read())).convert("RGB")
            image = cv2.resize(np.array(image), (224, 224)) / 255.0
            image = np.expand_dims(image, axis=0)

            prediction = model.predict(image)

            # Flexible check regardless of model output shape
            if prediction.shape[1] == 2:
                label = "Cheating" if prediction[0][1] > prediction[0][0] else "Not Cheating"
            else:
                label = "Cheating" if prediction[0][0] > 0.5 else "Not Cheating"

            results.append(label)

        except Exception as e:
            return jsonify({"error": f"Error processing image: {str(e)}"}), 500

    return jsonify({"results": results})


# Route 2: Auto-classify student logs after exam
@classification_bp.route('/classify_behavior_logs', methods=['POST'])
def classify_behavior_logs():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

    data = request.json
    user_id = data.get('user_id')
    exam_id = data.get('exam_id')

    if not user_id or not exam_id:
        return jsonify({"error": "Missing user_id or exam_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, image_base64 FROM suspicious_behavior_logs
            WHERE user_id = %s AND exam_id = %s AND image_base64 IS NOT NULL
        """, (user_id, exam_id))

        logs = cursor.fetchall()

        for log in logs:
            try:
                img_data = base64.b64decode(log['image_base64'])
                image = Image.open(io.BytesIO(img_data)).convert("RGB")
                image = cv2.resize(np.array(image), (224, 224)) / 255.0
                image = np.expand_dims(image, axis=0)

                prediction = model.predict(image)

                if prediction.shape[1] == 2:
                    label = "Cheating" if prediction[0][1] > prediction[0][0] else "Not Cheating"
                else:
                    label = "Cheating" if prediction[0][0] > 0.5 else "Not Cheating"

                cursor2 = conn.cursor()
                cursor2.execute("""
                    UPDATE suspicious_behavior_logs
                    SET classification_label = %s
                    WHERE id = %s
                """, (label, log['id']))
                conn.commit()

            except Exception as e:
                print(f"❌ Failed to classify image ID {log['id']}: {str(e)}")

        conn.close()
        return jsonify({"message": "Classification complete."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
