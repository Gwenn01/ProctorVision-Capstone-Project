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
        # -------- Inputs --------
        title          = (request.form.get("title") or "").strip()
        description    = (request.form.get("description") or "").strip()
        duration       = request.form.get("time")  # minutes (string)
        instructor_id  = request.form.get("instructor_id")
        exam_date      = request.form.get("exam_date")
        start_time     = request.form.get("start_time")
        students_json  = request.form.get("students")
        exam_type      = request.form.get("exam_type")
        questions_json = request.form.get("questions")
        instructions   = (request.form.get("instructions") or "").strip()
        exam_file      = request.files.get("exam_file")
        # allow frontend to send "QA" or "CODING"
        exam_category_in = (request.form.get("exam_category") or "").strip().upper()

        # -------- Base validation (always) --------
        if not title or not description or not instructor_id or not exam_date or not start_time or not exam_type:
            return jsonify({"error": "Missing required fields"}), 400
        try:
            if not duration or int(duration) <= 0:
                return jsonify({"error": "Duration is required"}), 400
        except ValueError:
            return jsonify({"error": "Duration must be a number (minutes)."}), 400

        # -------- Parse JSON --------
        students  = json.loads(students_json) if students_json else []
        questions = json.loads(questions_json) if questions_json else []

        # -------- Normalize/Infer category (QA or CODING only) --------
        if exam_category_in in ("QA", "MCQ"):
            exam_category = "QA"          # treat MCQ as QA in DB
        elif exam_category_in == "CODING":
            exam_category = "CODING"
        else:
            # Infer if not provided/unknown
            exam_category = "QA" if (questions and len(questions) > 0) else "CODING"

        # -------- Category-specific validation --------
        if exam_category == "QA":
            if not questions or len(questions) == 0:
                return jsonify({"error": "QA exam must include at least one question."}), 400
        else:  # CODING
            if not instructions and not exam_file:
                return jsonify({"error": "CODING exam requires instructions text or an attached file."}), 400

        # -------- DB --------
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1) Insert exam (exam_file set to NULL initially)
        cursor.execute("""
            INSERT INTO exams (
                instructor_id, exam_type, exam_category,
                title, description, duration_minutes,
                exam_date, start_time, exam_file
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL)
        """, (
            instructor_id, exam_type, exam_category,
            title, description, int(duration),
            exam_date, start_time
        ))
        exam_id = cursor.lastrowid

        # 2) Optional file save and update exams.exam_file
        if exam_file and exam_file.filename:
            exam_dir = os.path.join(UPLOAD_FOLDER, str(exam_id))
            os.makedirs(exam_dir, exist_ok=True)
            saved_file_name = secure_filename(exam_file.filename)
            saved_file_path = os.path.join(exam_dir, saved_file_name)
            exam_file.save(saved_file_path)
            relative_path = f"{UPLOAD_FOLDER}/{exam_id}/{saved_file_name}".replace("\\", "/")
            cursor.execute("UPDATE exams SET exam_file=%s WHERE id=%s", (relative_path, exam_id))

        # 3) Save instructions only for CODING (and only if provided)
        if exam_category == "CODING" and instructions:
            cursor.execute(
                "INSERT INTO exam_instructions (exam_id, instructions) VALUES (%s, %s)",
                (exam_id, instructions)
            )

        # 4) Assign students
        for student in students:
            cursor.execute(
                "INSERT INTO exam_students (exam_id, student_id) VALUES (%s, %s)",
                (exam_id, student["id"])
            )

        # 5) Insert questions & options only for QA
        if exam_category == "QA":
            for q in questions:
                question_text = (q.get("questionText") or "").strip()
                if not question_text:
                    # skip empty question shells
                    continue
                cursor.execute(
                    "INSERT INTO exam_questions (exam_id, question_text) VALUES (%s, %s)",
                    (exam_id, question_text)
                )
                question_id = cursor.lastrowid

                opts = q.get("options", []) or []
                correct_index = q.get("correctAnswer", None)
                for i, opt in enumerate(opts):
                    option_text = str(opt)
                    is_correct = (i == correct_index)
                    cursor.execute(
                        "INSERT INTO exam_options (question_id, option_text, is_correct) VALUES (%s, %s, %s)",
                        (question_id, option_text, is_correct)
                    )

        conn.commit()

        return jsonify({
            "message": f"{exam_type} created successfully",
            "exam_id": exam_id,
            "exam_category": exam_category
        }), 201

    except Exception as e:
        print("❌ Error in /create-exam:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()
