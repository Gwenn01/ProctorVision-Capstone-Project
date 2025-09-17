from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
import os, json
from werkzeug.utils import secure_filename

exam_bp = Blueprint("exam", __name__)

UPLOAD_FOLDER = "uploads/exams"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@exam_bp.route("/create-exam", methods=["POST"])
def create_exam():
    try:
        # Get form fields
        title = request.form.get("title")
        description = request.form.get("description")
        duration = request.form.get("time")   # always required
        instructor_id = request.form.get("instructor_id")
        exam_date = request.form.get("exam_date")
        start_time = request.form.get("start_time")
        students_json = request.form.get("students")
        exam_type = request.form.get("exam_type")
        exam_file = request.files.get("exam_file")
        questions_json = request.form.get("questions")  # ✅ NEW

        # Validation
        if not title or not description or not instructor_id or not exam_date or not start_time or not exam_type:
            return jsonify({"error": "Missing required fields"}), 400

        if not duration or int(duration) <= 0:
            return jsonify({"error": "Duration is required"}), 400

        # Parse JSON
        students = json.loads(students_json) if students_json else []
        questions = json.loads(questions_json) if questions_json else []

        # Handle file upload
        file_path = None
        if exam_file:
            filename = secure_filename(exam_file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            exam_file.save(file_path)

        # DB connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert exam
        cursor.execute("""
            INSERT INTO exams (
                instructor_id, exam_type, title, description, duration_minutes,
                exam_date, start_time, exam_file
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            instructor_id, exam_type, title, description,
            duration, exam_date, start_time, file_path
        ))
        exam_id = cursor.lastrowid

        # Assign students
        for student in students:
            cursor.execute("""
                INSERT INTO exam_students (exam_id, student_id)
                VALUES (%s, %s)
            """, (exam_id, student["id"]))

        # Insert questions & options
        for q in questions:
            cursor.execute("""
                INSERT INTO exam_questions (exam_id, question_text)
                VALUES (%s, %s)
            """, (exam_id, q["questionText"]))
            question_id = cursor.lastrowid

            # Add options
            for i, opt in enumerate(q["options"]):
                is_correct = (i == q.get("correctAnswer"))
                cursor.execute("""
                    INSERT INTO exam_options (question_id, option_text, is_correct)
                    VALUES (%s, %s, %s)
                """, (question_id, opt, is_correct))

        conn.commit()

        return jsonify({
            "message": f"{exam_type} created successfully",
            "exam_id": exam_id
        }), 201

    except Exception as e:
        print("❌ Error in /create-exam:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        if 'conn' in locals():
            conn.close()
