# routes/behavior_routes.py
from flask import Blueprint, request, jsonify
from services.behavior_service import save_behavior_log

behavior_bp = Blueprint('behavior', __name__)

@behavior_bp.route('/save_behavior_log', methods=['POST'])
def save_behavior_log_route():
    data = request.json or {}
    user_id = data.get('user_id')
    exam_id = data.get('exam_id')
    image_base64 = data.get('image_base64')
    warning_type = data.get('warning_type')

    if not all([user_id, exam_id, image_base64, warning_type]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        _id = save_behavior_log(int(user_id), int(exam_id), image_base64, warning_type)
        return jsonify({"message": "Behavior log saved successfully", "id": _id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
