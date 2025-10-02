
from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
from datetime import datetime

exam_submit_bp = Blueprint("exam_submit_bp", __name__)

## -----------------------------
#  Submit Exam with answers and auto-score
# -----------------------------
@exam_submit_bp.route("/submit_exam", methods=["POST"])
def submit_exam():
    data = request.get_json(force=True) or {}
    user_id = data.get("user_id")
    exam_id = data.get("exam_id")
    answers = data.get("answers") or {}

    if not user_id or not exam_id:
        return jsonify({"error": "Missing user_id or exam_id"}), 400
    if not isinstance(answers, dict):
        return jsonify({"error": "answers must be {question_id: answer}"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch exam details
        cursor.execute("SELECT * FROM exams WHERE id = %s", (exam_id,))
        exam = cursor.fetchone()

        if not exam:
            return jsonify({"error": "Exam not found"}), 404

        exam_category = exam.get("exam_category")  # QA or CODING
        now = datetime.now()

        # Handle CODING exams (no auto-grading, just record submission)
        if exam_category and exam_category.upper() == "CODING":
            cursor.execute("""
                INSERT INTO exam_submissions (user_id, exam_id, score, total_score, submitted_at)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    submitted_at = VALUES(submitted_at),
                    id = LAST_INSERT_ID(id)
            """, (user_id, exam_id, 0, 0, now))
            submission_id = cursor.lastrowid

            conn.commit()
            conn.close()

            return jsonify({
                "message": "Coding exam submitted successfully",
                "exam_id": exam_id,
                "category": "CODING"
            }), 200

        # Handle QA exams
        cursor.execute("SELECT * FROM exam_questions WHERE exam_id = %s", (exam_id,))
        questions = cursor.fetchall()

        total_score = len(questions)
        if total_score == 0:
            conn.close()
            return jsonify({"error": "No questions found"}), 400

        # Insert submission record
        cursor.execute("""
            INSERT INTO exam_submissions (user_id, exam_id, score, total_score, submitted_at)
            VALUES (%s, %s, 0, %s, %s)
            ON DUPLICATE KEY UPDATE
                submitted_at = VALUES(submitted_at),
                id = LAST_INSERT_ID(id)
        """, (user_id, exam_id, total_score, now))
        submission_id = cursor.lastrowid

        score = 0
        review = []

        for q in questions:
            q_id = q["id"]
            q_type = q.get("question_type", "mcq")
            student_answer = answers.get(str(q_id))

            selected_option_id = None
            selected_text = None
            essay_answer = None
            is_correct = None
            correct_answer = None

            # ----- MCQ -----
            if q_type == "mcq":
                cursor.execute(
                    "SELECT id, option_text, is_correct FROM exam_options WHERE question_id = %s",
                    (q_id,),
                )
                options = cursor.fetchall()

                correct_opt = next((o for o in options if o["is_correct"]), None)
                correct_answer = correct_opt["option_text"] if correct_opt else None

                selected_opt = next((o for o in options if o["id"] == student_answer), None)
                selected_option_id = student_answer
                selected_text = selected_opt["option_text"] if selected_opt else None

                is_correct = 1 if (selected_opt and selected_opt["is_correct"]) else 0
                if is_correct:
                    score += 1

            # ----- Identification -----
            elif q_type == "identification":
                correct_answer = q.get("correct_answer")
                selected_text = (student_answer or "").strip()

                if correct_answer:
                    is_correct = 1 if selected_text.lower() == correct_answer.lower() else 0
                else:
                    is_correct = 0

                if is_correct:
                    score += 1

            # ----- Essay -----
            elif q_type == "essay":
                essay_answer = (student_answer or "").strip()
                is_correct = None  # manual grading

            # Insert into exam_answers
            cursor.execute("""
                INSERT INTO exam_answers
                  (submission_id, question_id, selected_option_id, selected_text, essay_answer, is_correct)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  selected_option_id = VALUES(selected_option_id),
                  selected_text = VALUES(selected_text),
                  essay_answer = VALUES(essay_answer),
                  is_correct = VALUES(is_correct)
            """, (submission_id, q_id, selected_option_id, selected_text, essay_answer, is_correct))

            review.append({
                "question_id": q_id,
                "question_text": q["question_text"],
                "question_type": q_type,
                "selected_answer": essay_answer if q_type == "essay" else selected_text,
                "correct_answer": correct_answer,
                "is_correct": (None if is_correct is None else bool(is_correct)),
            })

        # Finalize submission score
        cursor.execute(
            "UPDATE exam_submissions SET score = %s, total_score = %s WHERE id = %s",
            (score, total_score, submission_id),
        )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Exam submitted successfully",
            "score": score,
            "total_score": total_score,
            "answers": review
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
#  exam submision to make a condition for take exam 
# -----------------------------
@exam_submit_bp.route("/get_exam_submissions", methods=["GET"])
def get_exam_submissions():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT exam_id FROM exam_submissions
            WHERE user_id = %s
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# -----------------------------
#  Get exam results with answers (for review)
# -----------------------------
@exam_submit_bp.route("/exam-review", methods=["GET"])
def exam_review():
    user_id = request.args.get("user_id")
    exam_id = request.args.get("exam_id")

    if not user_id or not exam_id:
        return jsonify({"error": "Missing user_id or exam_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch exam submission summary
        cursor.execute("""
            SELECT id AS submission_id, score, total_score, submitted_at
            FROM exam_submissions
            WHERE user_id = %s AND exam_id = %s
            LIMIT 1
        """, (user_id, exam_id))
        submission = cursor.fetchone()

        if not submission:
            return jsonify({"error": "No submission found"}), 404

        submission_id = submission["submission_id"]

        # Fetch answers with full question info
        cursor.execute("""
            SELECT 
                q.id AS question_id,
                q.question_text,
                q.question_type,
                ea.selected_option_id,
                ea.selected_text,
                ea.essay_answer,
                ea.is_correct,
                q.correct_answer
            FROM exam_answers ea
            JOIN exam_questions q ON ea.question_id = q.id
            WHERE ea.submission_id = %s
        """, (submission_id,))
        answers = cursor.fetchall()

        # Normalize data so frontend can easily display
        formatted_answers = []
        for ans in answers:
            selected_answer = None
            correct_answer = ans.get("correct_answer")

            if ans["question_type"] == "mcq":
                # For MCQ, fetch selected option text
                if ans["selected_option_id"]:
                    cursor.execute(
                        "SELECT option_text FROM exam_options WHERE id = %s",
                        (ans["selected_option_id"],)
                    )
                    row = cursor.fetchone()
                    selected_answer = row["option_text"] if row else None

                # Fetch correct answer text
                cursor.execute(
                    "SELECT option_text FROM exam_options WHERE question_id = %s AND is_correct = 1",
                    (ans["question_id"],)
                )
                row = cursor.fetchone()
                correct_answer = row["option_text"] if row else None

            elif ans["question_type"] == "identification":
                selected_answer = ans["selected_text"]

            elif ans["question_type"] == "essay":
                selected_answer = ans["essay_answer"]

            formatted_answers.append({
                "question_id": ans["question_id"],
                "question_text": ans["question_text"],
                "question_type": ans["question_type"],
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "is_correct": (
                    None if ans["is_correct"] is None else bool(ans["is_correct"])
                ),
            })

        conn.close()

        return jsonify({
            "exam_id": exam_id,
            "score": submission["score"],
            "total_score": submission["total_score"],
            "submitted_at": submission["submitted_at"],
            "answers": formatted_answers
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
