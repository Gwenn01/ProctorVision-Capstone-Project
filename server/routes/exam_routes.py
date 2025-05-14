from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
import os, json
from werkzeug.utils import secure_filename
from datetime import datetime

exam_bp = Blueprint("exam", __name__)

UPLOAD_FOLDER = "uploads/exams"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@exam_bp.route("/create-exam", methods=["POST"])
def create_exam():
    try:
        # Get form fields
        title = request.form.get("title")
        description = request.form.get("description")
        duration = request.form.get("time")
        instructor_id = request.form.get("instructor_id")
        exam_date = request.form.get("exam_date")
        start_time = request.form.get("start_time")
        students_json = request.form.get("students")
        exam_file = request.files.get("exam_file")

        if not title or not description or not duration or not instructor_id or not exam_date or not start_time:
            return jsonify({"error": "Missing required fields"}), 400

        # Parse students
        students = json.loads(students_json)

        # Save file if provided
        file_path = None
        if exam_file:
            filename = secure_filename(exam_file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            exam_file.save(file_path)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert exam
        cursor.execute("""
            INSERT INTO exams (
                instructor_id, title, description, duration_minutes,
                exam_date, start_time, exam_file
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            instructor_id, title, description, duration,
            exam_date, start_time, file_path
        ))
        exam_id = cursor.lastrowid

        # Insert students
        for student in students:
            cursor.execute("""
                INSERT INTO exam_students (exam_id, student_id)
                VALUES (%s, %s)
            """, (exam_id, student["id"]))

        conn.commit()
        return jsonify({"message": "Exam created successfully", "exam_id": exam_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'conn' in locals():
            conn.close()
