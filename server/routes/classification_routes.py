import os
from flask import Blueprint, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io

classification_bp = Blueprint('classification_bp', __name__)

# ✅ Load the model
model_path = "cheating_detection_model.h5"

if os.path.exists(model_path):
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully.")
else:
    model = None
    print(f"Error: Model file '{model_path}' not found.")

@classification_bp.route('/classify_multiple', methods=['POST'])
def classify_multiple():
    """Classifies multiple uploaded images for cheating detection."""

    if model is None:
        return jsonify({"error": "Model not loaded. Check file path."}), 500

    # ✅ Ensure that files are included in the request
    if 'files' not in request.files or len(request.files.getlist('files')) == 0:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist('files')
    results = []

    for file in files:
        try:
            image = Image.open(io.BytesIO(file.read()))
            image = cv2.resize(np.array(image), (224, 224)) / 255.0
            image = np.expand_dims(image, axis=0)

            prediction = model.predict(image)
            result = "Cheating" if prediction[0][1] > prediction[0][0] else "Not Cheating"
            results.append(result)

        except Exception as e:
            return jsonify({"error": f"Error processing image: {str(e)}"}), 500

    return jsonify({"results": results})
