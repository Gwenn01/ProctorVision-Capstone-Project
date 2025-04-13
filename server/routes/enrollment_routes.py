from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

enrollment_bp = Blueprint('enrollment', __name__)

# Get ALL students (regardless of assignment)
@enrollment_bp.route("/all-students", methods=["GET"])
def get_all_students():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE user_type = 'Student'")
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Get ONLY students assigned to this instructor
@enrollment_bp.route("/enrolled-students/<int:instructor_id>", methods=["GET"])
def get_enrolled_students(instructor_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT u.* FROM instructor_assignments ia
        JOIN users u ON u.id = ia.student_id
        WHERE ia.instructor_id = %s
        """
        cursor.execute(query, (instructor_id,))
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# 3. Assign a student to instructor
@enrollment_bp.route("/assign-student", methods=["POST"])
def assign_student():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    student_id = data.get("student_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM instructor_assignments 
            WHERE instructor_id = %s AND student_id = %s
        """, (instructor_id, student_id))
        if cursor.fetchone():
            return jsonify({"message": "Student already assigned."}), 409

        cursor.execute("""
            INSERT INTO instructor_assignments (instructor_id, student_id)
            VALUES (%s, %s)
        """, (instructor_id, student_id))
        conn.commit()
        return jsonify({"message": "Student assigned successfully."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

#  Unassign a student from the instructor
@enrollment_bp.route("/unassign-student", methods=["POST"])
def unassign_student():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    student_id = data.get("student_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM instructor_assignments 
            WHERE instructor_id = %s AND student_id = %s
        """, (instructor_id, student_id))
        conn.commit()
        return jsonify({"message": "Student unassigned successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
