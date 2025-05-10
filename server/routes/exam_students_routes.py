# routes/enrollment_routes.py
from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

exam_students_bp = Blueprint('exam_students_bp', __name__)

# Get all students (for dropdown)
@exam_students_bp.route("/students", methods=["GET"])
def get_all_students():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, email
            FROM users
            WHERE user_type = 'Student'
        """)
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Get students enrolled in a specific exam
@exam_students_bp.route("/exam_students/<int:exam_id>", methods=["GET"])
def get_enrolled_students(exam_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT u.id, u.name, u.email
            FROM exam_students es
            JOIN users u ON es.student_id = u.id
            WHERE es.exam_id = %s
        """, (exam_id,))
        students = cursor.fetchall()
        return jsonify(students), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()

# Add a student to an exam
@exam_students_bp.route("/exam_students", methods=["POST"])
def add_student_to_exam():
    data = request.json
    exam_id = data.get("exam_id")
    student_id = data.get("student_id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO exam_students (exam_id, student_id)
            VALUES (%s, %s)
        """, (exam_id, student_id))
        conn.commit()
        return jsonify({"message": "Student added."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Remove a student from an exam
@exam_students_bp.route("/exam_students/<int:exam_id>/<int:student_id>", methods=["DELETE"])
def remove_student_from_exam(exam_id, student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM exam_students
            WHERE exam_id = %s AND student_id = %s
        """, (exam_id, student_id))
        conn.commit()
        return jsonify({"message": "Student removed."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
