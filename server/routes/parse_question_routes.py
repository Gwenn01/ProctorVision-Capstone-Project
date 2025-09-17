from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename
import docx
import pdfplumber

parse_question_bp = Blueprint("parse_question", __name__)

UPLOAD_FOLDER = "uploads/question_files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@parse_question_bp.route("/parse-questions", methods=["POST"])
def parse_questions():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    questions = []

    # DOCX
    if filename.endswith(".docx"):
        doc = docx.Document(filepath)
        q = None
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue

            # Example format: "Q1. What is 2+2?"
            if text.lower().startswith("q"):
                if q:
                    questions.append(q)
                q = {"questionText": text, "options": [], "correctAnswer": None}

            elif text.lower().startswith(("a.", "b.", "c.", "d.")):
                if q:
                    q["options"].append(text)

        if q:
            questions.append(q)

    # PDF
    elif filename.endswith(".pdf"):
        with pdfplumber.open(filepath) as pdf:
            q = None
            for page in pdf.pages:
                for line in page.extract_text().split("\n"):
                    text = line.strip()
                    if text.lower().startswith("q"):
                        if q:
                            questions.append(q)
                        q = {"questionText": text, "options": [], "correctAnswer": None}
                    elif text.lower().startswith(("a.", "b.", "c.", "d.")):
                        if q:
                            q["options"].append(text)
            if q:
                questions.append(q)

    return jsonify({"questions": questions})
