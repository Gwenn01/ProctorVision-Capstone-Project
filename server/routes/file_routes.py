from flask import Blueprint, send_from_directory, abort, jsonify
import fitz  # PyMuPDF
import os

file_bp = Blueprint('file_bp', __name__)

# Full path to the 'uploads/exams' folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'exams')

@file_bp.route('/uploads/exams/<path:filename>', methods=['GET'])
def serve_exam_file(filename):

    if not filename.endswith('.pdf'):
        abort(400, description="Only PDF files are allowed.")

    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'exams')
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.isfile(file_path):
        abort(404, description="File not found.")

    return send_from_directory(UPLOAD_FOLDER, filename)

@file_bp.route('/api/exam_text/<filename>', methods=['GET'])
def get_exam_text(filename):
    pdf_path = os.path.join(os.getcwd(), 'uploads', 'exams', filename)
    if not os.path.isfile(pdf_path):
        return jsonify({"error": "PDF file not found"}), 404

    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text()

        return jsonify({"content": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



