from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

instructor_behavior_bp = Blueprint('instructor_behavior_bp', __name__)

@instructor_behavior_bp.route('/exam-assigned-students/<int:exam_id>', methods=['GET'])
def get_assigned_students_for_exam(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Step 1: Get instructor_id from the exam
        cursor.execute("SELECT instructor_id FROM exams WHERE id = %s", (exam_id,))
        exam = cursor.fetchone()

        if not exam:
            return jsonify({"error": "Exam not found"}), 404

        instructor_id = exam["instructor_id"]

        # Step 2: Correct join with instructor_id filter in WHERE
        cursor.execute("""
            SELECT 
                u.id AS student_id,
                u.name,
                u.username,
                MAX(ia.is_login) AS is_login,
                MAX(ia.is_taking_exam) AS is_taking_exam,
                MAX(ia.suspicious_behavior_count) AS suspicious_behavior_count
            FROM exam_students es
            JOIN users u ON es.student_id = u.id
            JOIN instructor_assignments ia ON ia.student_id = u.id
            WHERE es.exam_id = %s
            GROUP BY u.id, u.name, u.username
        """, (exam_id,))

        students = cursor.fetchall()  
        return jsonify(students), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()
