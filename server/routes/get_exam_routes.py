from flask import Blueprint, jsonify, request
from database.connection import get_db_connection

get_exam_bp = Blueprint('get_exam', __name__)

@get_exam_bp.route('/get_exam', methods=['GET'])
def get_exam():
    student_id = request.args.get('student_id')
    print(student_id)
    if not student_id:
        return jsonify({"error": "Missing student_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT e.id, e.title, e.description, e.duration_minutes
            FROM exams e
            JOIN exam_students es ON e.id = es.exam_id
            WHERE es.student_id = %s
        """
        cursor.execute(query, (student_id,))
        exams = cursor.fetchall()
        conn.close()
        return jsonify(exams), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
