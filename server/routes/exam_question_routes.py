from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

exam_questions_bp = Blueprint("exam_questions", __name__)

# -----------------------------
# Get all questions (with options) for an exam
# -----------------------------
@exam_questions_bp.route("/exam_questions/<int:exam_id>", methods=["GET"])
def get_exam_questions(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get all questions
        cursor.execute("SELECT * FROM exam_questions WHERE exam_id = %s", (exam_id,))
        questions = cursor.fetchall()

        # Attach options to each question
        for q in questions:
            cursor.execute(
                "SELECT id, option_text, is_correct FROM exam_options WHERE question_id = %s",
                (q["id"],),
            )
            options = cursor.fetchall()

            # ✅ Ensure option_text is always a string
            for opt in options:
                opt["option_text"] = str(opt["option_text"])

            q["options"] = options
            # ✅ Add correct_answer index (for frontend)
            q["correct_answer"] = next(
                (i for i, opt in enumerate(options) if opt["is_correct"]), None
            )

        conn.close()
        return jsonify(questions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Add a question with options
# -----------------------------
@exam_questions_bp.route("/exam_questions", methods=["POST"])
def add_exam_question():
    try:
        data = request.json
        exam_id = data.get("exam_id")
        question_text = data.get("question_text")
        options = data.get("options", [])
        correct_answer = data.get("correct_answer")  # index of correct option

        if not exam_id or not question_text or not options:
            return jsonify({"error": "Missing required fields"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert question
        cursor.execute(
            "INSERT INTO exam_questions (exam_id, question_text) VALUES (%s, %s)",
            (exam_id, question_text),
        )
        question_id = cursor.lastrowid

        # Insert options
        for i, opt in enumerate(options):
            is_correct = 1 if i == correct_answer else 0
            cursor.execute(
                "INSERT INTO exam_options (question_id, option_text, is_correct) VALUES (%s, %s, %s)",
                (question_id, opt, is_correct),
            )

        conn.commit()
        conn.close()
        return jsonify({"message": "Question added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Update a question (and options)
# -----------------------------
@exam_questions_bp.route("/exam_questions/<int:question_id>", methods=["PUT"])
def update_exam_question(question_id):
    try:
        data = request.json
        question_text = data.get("question_text")
        options = data.get("options", [])
        correct_answer = data.get("correct_answer")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update question text
        cursor.execute(
            "UPDATE exam_questions SET question_text = %s WHERE id = %s",
            (question_text, question_id),
        )

        # Delete old options
        cursor.execute("DELETE FROM exam_options WHERE question_id = %s", (question_id,))

        # Insert new options
        for i, opt in enumerate(options):
            is_correct = 1 if i == correct_answer else 0
            cursor.execute(
                "INSERT INTO exam_options (question_id, option_text, is_correct) VALUES (%s, %s, %s)",
                (question_id, opt, is_correct),
            )

        conn.commit()
        conn.close()
        return jsonify({"message": "Question updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Delete a question (and its options)
# -----------------------------
@exam_questions_bp.route("/exam_questions/<int:question_id>", methods=["DELETE"])
def delete_exam_question(question_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM exam_options WHERE question_id = %s", (question_id,))
        cursor.execute("DELETE FROM exam_questions WHERE id = %s", (question_id,))

        conn.commit()
        conn.close()
        return jsonify({"message": "Question deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Get exam with questions + options
# -----------------------------
@exam_questions_bp.route("/exam_with_questions/<int:exam_id>", methods=["GET"])
def get_exam_with_questions(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch questions
        cursor.execute("SELECT * FROM exam_questions WHERE exam_id = %s", (exam_id,))
        questions = cursor.fetchall()

        for q in questions:
            cursor.execute(
                "SELECT id, option_text, is_correct FROM exam_options WHERE question_id = %s",
                (q["id"],),
            )
            options = cursor.fetchall()

            for opt in options:
                opt["option_text"] = str(opt["option_text"])
                opt["is_correct"] = bool(opt["is_correct"])

            q["options"] = options
          
            q["correct_answer"] = next(
                (i for i, opt in enumerate(options) if opt["is_correct"]), None
            )

        conn.close()
        return jsonify(questions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
