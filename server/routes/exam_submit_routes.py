from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

exam_submit_bp = Blueprint("exam_submit_bp", __name__)

@exam_submit_bp.route("/submit_exam", methods=["POST"])
def submit_exam():
    data = request.json
    user_id = data.get("user_id")
    exam_id = data.get("exam_id")

    if not user_id or not exam_id:
        return jsonify({"error": "Missing user_id or exam_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT IGNORE INTO exam_submissions (user_id, exam_id)
            VALUES (%s, %s)
        """, (user_id, exam_id))

        conn.commit()
        conn.close()

        return jsonify({"message": "✅ Exam submission recorded."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET route to fetch exams already submitted by user
@exam_submit_bp.route("/get_exam_submissions", methods=["GET"])
def get_exam_submissions():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT exam_id FROM exam_submissions
            WHERE user_id = %s
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
