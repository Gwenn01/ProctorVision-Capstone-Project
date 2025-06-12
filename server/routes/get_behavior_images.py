from flask import Blueprint, jsonify, request
from database.connection import get_db_connection

get_behavior_images_bp = Blueprint('get_behavior_images_bp', __name__)

# GET /api/exams-with-behavior?instructor_id=2
@get_behavior_images_bp.route("/exams-with-behavior", methods=["GET"])
def get_exams_with_behavior():
    instructor_id = request.args.get("instructor_id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if instructor_id:
            cursor.execute("""
                SELECT DISTINCT e.id, e.title
                FROM exams e
                JOIN exam_submissions es ON e.id = es.exam_id
                WHERE e.instructor_id = %s
            """, (instructor_id,))
        else:
            cursor.execute("""
                SELECT DISTINCT e.id, e.title
                FROM exams e
                JOIN exam_submissions es ON e.id = es.exam_id
            """)

        exams = cursor.fetchall()
        return jsonify(exams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Get students who submitted a specific exam
@get_behavior_images_bp.route('/exam-behavior/<int:exam_id>', methods=['GET'])
def get_exam_behavior(exam_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                u.id, 
                u.name, 
                u.username,
                CASE 
                    WHEN es.id IS NULL THEN 'Did Not Take Exam'
                    WHEN MAX(CASE WHEN sbl.classification_label = 'Cheating' THEN 1 ELSE 0 END) = 1 THEN 'Cheated'
                    ELSE 'Completed'
                END AS exam_status
            FROM exam_students exs
            JOIN users u ON exs.student_id = u.id
            LEFT JOIN exam_submissions es ON es.user_id = u.id AND es.exam_id = %s
            LEFT JOIN suspicious_behavior_logs sbl ON sbl.user_id = u.id AND sbl.exam_id = %s
            WHERE exs.exam_id = %s
            GROUP BY u.id, u.name, u.username, es.id;
        """, (exam_id, exam_id, exam_id))

        students = cursor.fetchall()
        return jsonify(students), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# Get all behavior images for a student in a specific exam
@get_behavior_images_bp.route('/behavior-images/<int:exam_id>/<int:student_id>', methods=['GET'])
def get_behavior_images(exam_id, student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT image_base64, warning_type, timestamp, classification_label
            FROM suspicious_behavior_logs
            WHERE exam_id = %s AND user_id = %s
            ORDER BY timestamp DESC
        """, (exam_id, student_id))
        images = cursor.fetchall()
        return jsonify(images), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
            
            
# fetch behavior logs for that specific student and exam
@get_behavior_images_bp.route('/student-exams/<int:student_id>', methods=['GET'])
def get_student_exams(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DISTINCT e.id, e.title
            FROM exams e
            JOIN exam_submissions es ON e.id = es.exam_id
            WHERE es.user_id = %s
        """, (student_id,))
        exams = cursor.fetchall()
        return jsonify(exams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
            
# Flask Route Example
@get_behavior_images_bp.route('/exam-submissions/<exam_id>', methods=['GET'])
def get_exam_submissions(exam_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT user_id FROM exam_submissions WHERE exam_id = %s", (exam_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([row["user_id"] for row in rows])

