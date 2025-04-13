from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

exam_bp = Blueprint("exam", __name__)

# Save exam with enrolled students
@exam_bp.route("/create-exam", methods=["POST"])
def create_exam():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    duration = data.get("time")
    instructor_id = data.get("instructor_id")
    students = data.get("students")  # List of student objects with IDs

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert exam
        cursor.execute("""
            INSERT INTO exams (instructor_id, title, description, duration_minutes)
            VALUES (%s, %s, %s, %s)
        """, (instructor_id, title, description, duration))
        exam_id = cursor.lastrowid

        # Insert enrolled students into exam_students
        for student in students:
            cursor.execute("""
                INSERT INTO exam_students (exam_id, student_id)
                VALUES (%s, %s)
            """, (exam_id, student['id']))

        conn.commit()
        return jsonify({"message": "Exam created successfully", "exam_id": exam_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()

# Get students assigned to this instructor (for dropdown list)
@exam_bp.route("/assigned-students/<int:instructor_id>", methods=["GET"])
def get_assigned_students(instructor_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.name, u.username
            FROM instructor_assignments ia
            JOIN users u ON u.id = ia.student_id
            WHERE ia.instructor_id = %s
        """, (instructor_id,))
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
