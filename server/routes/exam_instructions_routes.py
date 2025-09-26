# routes/exam_instructions_routes.py
from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

# Schema: exam_instructions(id PK, exam_id UNIQUE/FK, instructions TEXT)
exam_instructions_bp = Blueprint("exam_instructions", __name__)

# -----------------------------
# Get exam instructions (returns empty string if not found)
# -----------------------------
@exam_instructions_bp.route("/exam_instructions/<int:exam_id>", methods=["GET"])
def get_exam_instructions(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT instructions FROM exam_instructions WHERE exam_id = %s LIMIT 1",
            (exam_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        return jsonify(
            {
                "exam_id": exam_id,
                "instructions": (row["instructions"] if row else ""),
            }
        ), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Upsert exam instructions
# -----------------------------
@exam_instructions_bp.route("/exam_instructions/<int:exam_id>", methods=["PUT"])
def upsert_exam_instructions(exam_id):
    try:
        data = request.get_json(silent=True) or {}
        instructions = (data.get("instructions") or "").strip()

        if not instructions:
            return jsonify({"error": "instructions is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if row exists for this exam_id
        cursor.execute(
            "SELECT id FROM exam_instructions WHERE exam_id = %s LIMIT 1",
            (exam_id,),
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE exam_instructions SET instructions = %s WHERE exam_id = %s",
                (instructions, exam_id),
            )
        else:
            cursor.execute(
                "INSERT INTO exam_instructions (exam_id, instructions) VALUES (%s, %s)",
                (exam_id, instructions),
            )

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Instructions saved"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
