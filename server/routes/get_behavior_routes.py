from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

# ✅ New blueprint name to avoid conflict
get_behavior_bp = Blueprint('get_behavior', __name__)

# 📤 GET /api/get_behavior_logs - fetch suspicious behavior logs for a user
@get_behavior_bp.route('/get_behavior_logs', methods=['GET'])
def get_behavior_logs():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                sbl.exam_id,
                sbl.timestamp,
                sbl.warning_type,
                sbl.image_base64,
                 sbl.classification_label,
                e.title
            FROM suspicious_behavior_logs sbl
            JOIN exams e ON sbl.exam_id = e.id
            WHERE sbl.user_id = %s
            ORDER BY sbl.timestamp ASC
        """, (user_id,))
        
        logs = cursor.fetchall()
        conn.close()

        return jsonify(logs), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
