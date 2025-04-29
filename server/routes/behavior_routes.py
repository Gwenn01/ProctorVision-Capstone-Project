# routes/behavior_routes.py

from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

behavior_bp = Blueprint('behavior', __name__)

# POST: Save suspicious behavior log
@behavior_bp.route('/save_behavior_log', methods=['POST'])
def save_behavior_log():
    data = request.json
    user_id = data.get('user_id')           # Link to users table
    exam_id = data.get('exam_id')           # Link to exams table
    image_base64 = data.get('image_base64') # Captured base64 image
    warning_type = data.get('warning_type') # e.g. "Looking Away"

    # Validation
    if not all([user_id, exam_id, image_base64, warning_type]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        insert_query = """
            INSERT INTO suspicious_behavior_logs (user_id, exam_id, image_base64, warning_type)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(insert_query, (user_id, exam_id, image_base64, warning_type))
        conn.commit()
        conn.close()

        return jsonify({"message": "Behavior log saved successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
