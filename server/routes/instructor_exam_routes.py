from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

instructor_exam_bp = Blueprint("instructor_exam_bp", __name__)

# GET /api/instructors
@instructor_exam_bp.route("/instructors", methods=["GET"])
def get_instructors():
    conn = None  
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, user_id, name FROM users WHERE user_type = 'Instructor'")
        instructors = cursor.fetchall()
        return jsonify(instructors), 200
    except Exception as e:
        print("Error in get_instructors:", e)  # Optional debug
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
            SELECT id, title, description, duration_minutes, created_at
            FROM exams
            WHERE instructor_id = %s
        """, (instructor_id,))
        exams = cursor.fetchall()
        return jsonify(exams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# DELETE /api/exams/<int:exam_id>
@instructor_exam_bp.route("/exams/<int:exam_id>", methods=["DELETE"])
def delete_exam(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM exams WHERE id = %s", (exam_id,))
        conn.commit()
        return jsonify({"message": "Exam deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
        
# update exams
@instructor_exam_bp.route("/exams/<int:exam_id>", methods=["PUT"])
def update_exam(exam_id):
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")

    if not title or not description:
        return jsonify({"error": "Title and description are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE exams
            SET title = %s, description = %s
            WHERE id = %s
        """, (title, description, exam_id))
        conn.commit()
        return jsonify({"message": "Exam updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
