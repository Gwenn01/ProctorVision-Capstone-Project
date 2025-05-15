from flask import Blueprint, jsonify, request
from database.connection import get_db_connection
from datetime import datetime, date, time, timedelta  # ✅ FIXED IMPORT

get_exam_bp = Blueprint('get_exam', __name__)

@get_exam_bp.route('/get_exam', methods=['GET'])
def get_exam():
    student_id = request.args.get('student_id')
    print("Student ID:", student_id)
    
    if not student_id:
        return jsonify({"error": "Missing student_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT e.id, e.title, e.description, e.duration_minutes, e.exam_date, e.start_time, e.exam_file
            FROM exams e
            JOIN exam_students es ON e.id = es.exam_id
            WHERE es.student_id = %s
        """
        cursor.execute(query, (student_id,))
        exams = cursor.fetchall()

        for exam in exams:
            # Format exam_date
            if isinstance(exam["exam_date"], (datetime, date)):
                exam["exam_date"] = exam["exam_date"].strftime("%Y-%m-%d")

            # Handle start_time safely
            if isinstance(exam["start_time"], timedelta):
                total_seconds = int(exam["start_time"].total_seconds())
                hours, remainder = divmod(total_seconds, 3600)
                minutes, _ = divmod(remainder, 60)
                exam["start_time"] = f"{hours:02}:{minutes:02}:00"
            elif isinstance(exam["start_time"], time):
                exam["start_time"] = exam["start_time"].strftime("%H:%M:%S")

            # Handle duration_minutes safely
            if isinstance(exam["duration_minutes"], timedelta):
                exam["duration_minutes"] = int(exam["duration_minutes"].total_seconds() // 60)

        conn.close()
        return jsonify(exams), 200

    except Exception as e:
        print("Error fetching exams:", e)
        return jsonify({"error": str(e)}), 500


@get_exam_bp.route('/update_exam_status_start', methods=['POST'])
def update_exam_status_start():
    data = request.get_json()
    student_id = data.get("student_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE instructor_assignments 
            SET is_taking_exam = 1
            WHERE student_id = %s
            """,
            (student_id,)  #  FIXED tuple syntax
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Exam started, status updated"}), 200

    except Exception as e:
        print("Error updating exam start status:", e)
        return jsonify({"error": str(e)}), 500


@get_exam_bp.route('/update_exam_status_submit', methods=['POST'])
def update_exam_status_submit():
    data = request.get_json()
    student_id = data.get("student_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE instructor_assignments 
            SET is_taking_exam = 0
            WHERE student_id = %s
            """,
            (student_id,)  #  FIXED tuple syntax
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Exam started, status updated"}), 200

    except Exception as e:
        print("Error updating exam start status:", e)
        return jsonify({"error": str(e)}), 500