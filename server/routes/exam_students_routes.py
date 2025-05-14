from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
from datetime import datetime, timedelta

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

#update studetn exam
@exam_students_bp.route("/update-exams/<int:exam_id>", methods=["PUT"])
def update_exam(exam_id):
    data = request.get_json()
    print("🔍 Received data:", data)

    title = data.get("title")
    description = data.get("description")
    duration = int(data.get("duration_minutes")) if data.get("duration_minutes") else None

    # Convert RFC 1123 date string to YYYY-MM-DD
    exam_date_raw = data.get("exam_date")
    start_time = data.get("start_time") or None

    try:
        # Convert to MySQL date format
        exam_date = datetime.strptime(exam_date_raw, "%a, %d %b %Y %H:%M:%S %Z").strftime("%Y-%m-%d") if exam_date_raw else None

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE exams
            SET title = %s,
                description = %s,
                duration_minutes = %s,
                exam_date = %s,
                start_time = %s
            WHERE id = %s
        """, (title, description, duration, exam_date, start_time, exam_id))
        conn.commit()
        return jsonify({"message": "Exam updated successfully."}), 200
    except Exception as e:
        print("Error during update:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# Get all exams by instructor 
@exam_students_bp.route("/exams-instructor/<int:instructor_id>", methods=["GET"])
def get_exams_by_instructor(instructor_id):
    conn = None
    try:
        print(f"Fetching exams for instructor ID: {instructor_id}")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM exams WHERE instructor_id = %s"
        print(f"Executing query: {query}")
        cursor.execute(query, (instructor_id,))
        
        exams = cursor.fetchall()

        # Fix non-serializable fields
        for exam in exams:
            # Convert start_time (timedelta) to HH:MM format
            if isinstance(exam.get("start_time"), timedelta):
                total_seconds = int(exam["start_time"].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                exam["start_time"] = f"{hours:02}:{minutes:02}"

            # Convert exam_date and created_at if datetime
            for field in ["exam_date", "created_at"]:
                if isinstance(exam.get(field), datetime):
                    exam[field] = exam[field].strftime("%Y-%m-%d %H:%M:%S")

        print(f"Found {len(exams)} exams.")
        return jsonify(exams), 200

    except Exception as e:
        print("Error fetching exams:", str(e))  
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()