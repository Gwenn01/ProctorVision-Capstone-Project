from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

manage_exam_routes = Blueprint('manage_exam_routes', __name__)

# Get exams created by a specific instructor
@manage_exam_routes.route("/exams/<int:instructor_id>", methods=["GET"])
def get_exams(instructor_id):
    conn = None 
    try:
        print("Instructor ID received:", instructor_id)
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, title, description, duration_minutes
            FROM exams
            WHERE instructor_id = %s
            ORDER BY id DESC
        """, (instructor_id,))

        exams = cursor.fetchall()
        print("Fetched Exams:", exams)
        return jsonify(exams), 200
    except Exception as e:
        print(" ERROR in GET /exams:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
