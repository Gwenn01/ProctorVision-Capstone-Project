from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

enrollment_bp = Blueprint('enrollment', __name__)

# Get ALL students with profiles
@enrollment_bp.route("/all-students", methods=["GET"])
def get_all_students():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT users.id, users.name, users.username, users.email, sp.course, sp.year, sp.section 
            FROM users 
            JOIN student_profiles sp ON users.id = sp.user_id 
            WHERE users.user_type = 'Student'
        """)
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        print("Error in /all-students:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Get students assigned to a specific instructor
@enrollment_bp.route("/enrolled-students/<int:instructor_id>", methods=["GET"])
def get_enrolled_students(instructor_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.name, u.username, u.email, sp.course, sp.year, sp.section
            FROM instructor_assignments ia
            JOIN users u ON u.id = ia.student_id
            JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.user_type = 'Student' AND ia.instructor_id = %s
        """, (instructor_id,))
        students = cursor.fetchall()
        return jsonify(students), 200
    except Exception as e:
        print("Error in /enrolled-students:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Return distinct course/section/year combinations for filtering
@enrollment_bp.route("/student-filters", methods=["GET"])
def get_student_filters():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DISTINCT course, section, year
            FROM student_profiles
            ORDER BY course, section, year
        """)
        filters = cursor.fetchall()
        return jsonify(filters), 200
    except Exception as e:
        print("Error in /student-filters:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Assign a single student to an instructor
@enrollment_bp.route("/assign-student", methods=["POST"])
def assign_student():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    student_id = data.get("student_id")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if already assigned
        cursor.execute("""
            SELECT 1 FROM instructor_assignments 
            WHERE instructor_id = %s AND student_id = %s
        """, (instructor_id, student_id))
        if cursor.fetchone():
            return jsonify({"message": "Student already assigned."}), 409

        # Assign student
        cursor.execute("""
            INSERT INTO instructor_assignments (instructor_id, student_id)
            VALUES (%s, %s)
        """, (instructor_id, student_id))
        conn.commit()
        return jsonify({"message": "Student assigned successfully."}), 201

    except Exception as e:
        print("Error in /assign-student:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Unassign a student from instructor
@enrollment_bp.route("/unassign-student", methods=["POST"])
def unassign_student():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    student_id = data.get("student_id")

    conn = None
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
        print("Error in /unassign-student:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Bulk assign students to instructor by course/section/year
@enrollment_bp.route("/assign-students-group", methods=["POST"])
def assign_students_group():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    course = data.get("course")
    section = data.get("section")
    year = data.get("year")

    if not all([instructor_id, course, section, year]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get all matching students
        cursor.execute("""
            SELECT u.id FROM users u
            JOIN student_profiles sp ON u.id = sp.user_id
            WHERE sp.course = %s AND sp.section = %s AND sp.year = %s
              AND u.user_type = 'Student'
        """, (course, section, year))
        students = cursor.fetchall()

        assigned = 0
        for s in students:
            student_id = s["id"]

            # Check if already assigned
            cursor.execute("""
                SELECT 1 FROM instructor_assignments
                WHERE instructor_id = %s AND student_id = %s
            """, (instructor_id, student_id))

            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO instructor_assignments (instructor_id, student_id)
                    VALUES (%s, %s)
                """, (instructor_id, student_id))
                assigned += 1

        conn.commit()
        return jsonify({"message": f"{assigned} students assigned."}), 201

    except Exception as e:
        print("Error in /assign-students-group:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
