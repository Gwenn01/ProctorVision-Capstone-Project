from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
from datetime import datetime
import traceback

instructor_exam_bp = Blueprint("instructor_exam_bp", __name__)

# GET /api/instructors
@instructor_exam_bp.route("/instructors", methods=["GET"])
def get_instructors():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name FROM users WHERE user_type = 'Instructor'")
        instructors = cursor.fetchall()
        return jsonify(instructors), 200
    except Exception as e:
        print("Error in get_instructors:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# GET /api/exams/instructor/<int:instructor_id>
@instructor_exam_bp.route("/exams/instructor/<int:instructor_id>", methods=["GET"])
def get_exams_by_instructor(instructor_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, title, description, duration_minutes, created_at,
                   exam_date, start_time, exam_file
            FROM exams
            WHERE instructor_id = %s
        """, (instructor_id,))
        exams = cursor.fetchall()

        for exam in exams:
            # Convert created_at (datetime) to string
            if isinstance(exam.get("created_at"), (str, type(None))) is False:
                exam["created_at"] = exam["created_at"].strftime("%Y-%m-%d %H:%M:%S")

            # Convert start_time (timedelta) to HH:MM:SS string
            start = exam.get("start_time")
            if start is not None and hasattr(start, "total_seconds"):
                total_seconds = int(start.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                exam["start_time"] = f"{hours:02}:{minutes:02}:00"

        return jsonify(exams), 200

    except Exception as e:
        print("ERROR in get_exams_by_instructor:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# DELETE /api/exams/<int:exam_id>
@instructor_exam_bp.route("/exams/<int:exam_id>", methods=["DELETE"])
def delete_exam(exam_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 🧩 Delete dependent child records first (order matters!)
        cursor.execute(
            "DELETE FROM exam_answers WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id=%s)",
            (exam_id,)
        )
        cursor.execute(
            "DELETE FROM exam_options WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id=%s)",
            (exam_id,)
        )
        cursor.execute("DELETE FROM exam_questions WHERE exam_id=%s", (exam_id,))
        cursor.execute("DELETE FROM exam_submissions WHERE exam_id=%s", (exam_id,))
        cursor.execute("DELETE FROM exam_instructions WHERE exam_id=%s", (exam_id,))

        # 🆕 Delete coding submissions linked to this exam
        cursor.execute("DELETE FROM coding_submissions WHERE exam_id=%s", (exam_id,))

        # ✅ Finally, delete the exam itself
        cursor.execute("DELETE FROM exams WHERE id = %s", (exam_id,))

        conn.commit()
        return jsonify({"message": "Exam and related data deleted successfully"}), 200

    except Exception as e:
        print("[ERROR] Exam deletion failed:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# PUT /api/exams/<int:exam_id>
@instructor_exam_bp.route("/exams/<int:exam_id>", methods=["PUT"])
def update_exam(exam_id):
    try:
        data = request.get_json()
        title = data.get("title")
        description = data.get("description")
        raw_exam_date = data.get("exam_date")
        start_time = data.get("start_time")

        # Log raw data
        print(f"Received update for Exam ID {exam_id}:")
        print(f"Title: {title}")
        print(f"Description: {description}")
        print(f"Raw Date: {raw_exam_date}")
        print(f"Start Time: {start_time}")

        # Convert exam_date to MySQL format (YYYY-MM-DD)
        try:
            exam_date = datetime.strptime(raw_exam_date, "%a, %d %b %Y %H:%M:%S %Z").strftime("%Y-%m-%d")
        except ValueError:
            # Try fallback if frontend sends ISO format (e.g., "2025-05-16")
            exam_date = raw_exam_date

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE exams
            SET title = %s,
                description = %s,
                exam_date = %s,
                start_time = %s
            WHERE id = %s
        """, (title, description, exam_date, start_time, exam_id))
        conn.commit()
        return jsonify({"message": "Exam updated successfully"}), 200

    except Exception as e:
        import traceback
        print("ERROR in update_exam:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
