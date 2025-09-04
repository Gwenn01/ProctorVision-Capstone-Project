import os, io, base64
from pathlib import Path
from flask import Blueprint, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image

try:
    # TF-bundled Keras (common with TensorFlow installs)
    from tensorflow.keras.applications import mobilenet_v2 as _mv2  # type: ignore
except Exception:
    # Standalone Keras 3
    from keras.applications import mobilenet_v2 as _mv2  # type: ignore

preprocess_input = _mv2.preprocess_input

from database.connection import get_db_connection

classification_bp = Blueprint('classification_bp', __name__)

# ---------- Model & threshold loading ----------
BASE_DIR  = Path(__file__).resolve().parent.parent   # -> server/
MODEL_DIR = BASE_DIR / "model"

CANDIDATES = [
    "cheating_mobilenetv2_final.keras",  # your chosen deploy name
    "mnv2_clean_best.keras",
    "mnv2_continue.keras",
    "mnv2_finetune_best.keras",
]

model_path = next((MODEL_DIR / f for f in CANDIDATES if (MODEL_DIR / f).exists()), None)
if model_path and model_path.exists():
    model = tf.keras.models.load_model(model_path, compile=False)
    print(f" Model loaded: {model_path}")
else:
    model = None
    print(f" No model file found in {MODEL_DIR}. Put one of: {CANDIDATES}")

thr_file = MODEL_DIR / "best_threshold.npy"
THRESHOLD = float(np.load(thr_file)[0]) if thr_file.exists() else 0.555
print(f"Using decision threshold: {THRESHOLD:.3f}")

# Input size
if model is not None:
    H, W = model.input_shape[1:3]
else:
    H, W = 224, 224  # fallback

# Class mapping used in training:
# class 0 -> "cheating", class 1 -> "non-cheating"
LABELS = ["Cheating", "Not Cheating"]

def preprocess_pil(pil_img: Image.Image) -> np.ndarray:
    """Convert PIL -> model-ready tensor (1, H, W, 3) using MobileNetV2 preprocessing."""
    img = pil_img.convert("RGB")
    if img.size != (W, H):
        img = img.resize((W, H), Image.BILINEAR)
    x = np.asarray(img, dtype=np.float32)
    x = preprocess_input(x)          # <- IMPORTANT: same preprocessing as training
    return np.expand_dims(x, 0)

def predict_batch(batch_np: np.ndarray) -> np.ndarray:
    """batch_np: (N, H, W, 3) already preprocessed; returns probs of class 1 (non-cheating)."""
    probs = model.predict(batch_np, verbose=0).ravel()
    # If model outputs 2 logits (softmax), convert to class-1 prob
    if probs.ndim == 0:    # single item edge case
        probs = np.array([probs])
    if len(probs) != batch_np.shape[0]:
        # Handle (N,2) softmax output
        raw = model.predict(batch_np, verbose=0)
        if raw.ndim == 2 and raw.shape[1] == 2:
            probs = raw[:, 1]  # prob for class index 1 => "Not Cheating"
        else:
            probs = raw.ravel()
    return probs

def label_from_prob(prob_non_cheating: float) -> str:
    """prob = P(class 1 = 'Not Cheating')"""
    return LABELS[int(prob_non_cheating >= THRESHOLD)]
# ------------------------------------------------


# -------- Route 1: classify uploaded multiple files --------
@classification_bp.route('/classify_multiple', methods=['POST'])
def classify_multiple():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

    files = request.files.getlist('files') if 'files' in request.files else []
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    # Preprocess all, predict in one batch (faster & avoids TF retracing spam)
    batch = []
    for f in files:
        try:
            pil = Image.open(io.BytesIO(f.read()))
            batch.append(preprocess_pil(pil)[0])  # (H,W,3)
        except Exception as e:
            return jsonify({"error": f"Error reading an image: {str(e)}"}), 400

    batch_np = np.stack(batch, axis=0)  # (N,H,W,3)
    probs = predict_batch(batch_np)     # prob of class 1 (Not Cheating)
    labels = [label_from_prob(p) for p in probs]

    return jsonify({
        "threshold": THRESHOLD,
        "results": [{"label": lbl, "prob_non_cheating": float(p)} for lbl, p in zip(labels, probs)]
    })


# -------- Route 2: auto-classify behavior logs --------
@classification_bp.route('/classify_behavior_logs', methods=['POST'])
def classify_behavior_logs():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

    data = request.get_json(silent=True) or {}
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

        # Vectorized predict in chunks
        CHUNK = 64
        for i in range(0, len(logs), CHUNK):
            chunk = logs[i:i+CHUNK]
            batch = []
            ids = []
            for log in chunk:
                try:
                    img_data = base64.b64decode(log['image_base64'])
                    pil = Image.open(io.BytesIO(img_data))
                    batch.append(preprocess_pil(pil)[0])
                    ids.append(log['id'])
                except Exception as e:
                    print(f" Failed to read image ID {log['id']}: {e}")

            if not batch:
                continue

            batch_np = np.stack(batch, axis=0)
            probs = predict_batch(batch_np)
            labels = [label_from_prob(p) for p in probs]

            # write back
            cur2 = conn.cursor()
            for _id, lbl in zip(ids, labels):
                cur2.execute(
                    "UPDATE suspicious_behavior_logs SET classification_label=%s WHERE id=%s",
                    (lbl, _id)
                )
            conn.commit()

        conn.close()
        return jsonify({"message": "Classification complete.", "threshold": THRESHOLD}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
