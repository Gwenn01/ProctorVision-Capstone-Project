
from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
from datetime import datetime

exam_submit_bp = Blueprint("exam_submit_bp", __name__)

# -----------------------------
#  Submit Exam with answers and auto-score
# -----------------------------
@exam_submit_bp.route("/submit_exam", methods=["POST"])
def submit_exam():
    data = request.get_json(force=True) or {}
    user_id = data.get("user_id")
    exam_id = data.get("exam_id")
    answers = data.get("answers") or {}  # may be {}

    if not user_id or not exam_id:
        return jsonify({"error": "Missing user_id or exam_id"}), 400
    if not isinstance(answers, dict):
        return jsonify({"error": "answers must be an object {question_id: option_id}"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # How many questions in this exam?
        cursor.execute("SELECT id FROM exam_questions WHERE exam_id = %s", (exam_id,))
        questions = cursor.fetchall()
        total_score = len(questions)
        if total_score == 0:
            conn.close()
            return jsonify({"error": "No questions found for this exam"}), 400

        now = datetime.now()

        # Insert or touch the submission; force LAST_INSERT_ID to existing row on duplicate
        cursor.execute("""
            INSERT INTO exam_submissions (user_id, exam_id, score, total_score, submitted_at)
            VALUES (%s, %s, 0, %s, %s)
            ON DUPLICATE KEY UPDATE
                submitted_at = VALUES(submitted_at),
                id = LAST_INSERT_ID(id)
        """, (user_id, exam_id, total_score, now))
        submission_id = cursor.lastrowid

        # Score answered questions (empty dict is fine; nothing loops)
        score = 0
        for q_id_raw, chosen_option in answers.items():
            try:
                q_id = int(q_id_raw)
            except (TypeError, ValueError):
                continue

            cursor.execute(
                "SELECT is_correct FROM exam_options WHERE id = %s AND question_id = %s",
                (chosen_option, q_id),
            )
            row = cursor.fetchone()
            is_correct = 1 if (row and row["is_correct"] == 1) else 0
            score += is_correct

            cursor.execute("""
                INSERT INTO exam_answers (submission_id, question_id, selected_option_id, is_correct)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    selected_option_id = VALUES(selected_option_id),
                    is_correct = VALUES(is_correct)
            """, (submission_id, q_id, chosen_option, is_correct))

        # Finalize submission
        cursor.execute(
            "UPDATE exam_submissions SET score = %s, total_score = %s WHERE id = %s",
            (score, total_score, submission_id),
        )

        # (Optional) return per-question review so your modal can show it immediately
        cursor.execute("""
            SELECT 
                q.id AS question_id,
                q.question_text,
                o.id AS selected_option_id,
                o.option_text AS selected_answer,
                ea.is_correct,
                (SELECT option_text FROM exam_options WHERE question_id = q.id AND is_correct = 1) AS correct_answer
            FROM exam_questions q
            LEFT JOIN exam_answers ea
                ON ea.question_id = q.id AND ea.submission_id = %s
            LEFT JOIN exam_options o
                ON o.id = ea.selected_option_id
            WHERE q.exam_id = %s
            ORDER BY q.id
        """, (submission_id, exam_id))
        review = cursor.fetchall()

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
#  Get exam results with answers (for review)
# -----------------------------
@exam_submit_bp.route("/get_exam_result", methods=["GET"])
def get_exam_result():
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

        # Fetch answers with question + selected option + correctness
        cursor.execute("""
            SELECT 
                q.id AS question_id,
                q.question_text,
                o.id AS selected_option_id,
                o.option_text AS selected_answer,
                ea.is_correct,
                (SELECT option_text FROM exam_options WHERE question_id = q.id AND is_correct = 1) AS correct_answer
            FROM exam_answers ea
            JOIN exam_questions q ON ea.question_id = q.id
            JOIN exam_options o ON ea.selected_option_id = o.id
            WHERE ea.submission_id = %s
        """, (submission_id,))
        answers = cursor.fetchall()

        conn.close()

        return jsonify({
            "exam_id": exam_id,
            "score": submission["score"],
            "total_score": submission["total_score"],
            "submitted_at": submission["submitted_at"],
            "answers": answers
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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