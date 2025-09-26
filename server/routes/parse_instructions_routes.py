# routes/parse_instructions_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from docx import Document
import os, io, tempfile, subprocess

parse_instructions_bp = Blueprint("parse_instructions", __name__)
ALLOWED = {".pdf", ".docx", ".txt", ".doc"}  # .doc handled via convert

def _normalize(text: str) -> str:
    return "\n".join((text or "").splitlines()).strip()

def _convert_doc_to_docx(raw_bytes: bytes) -> bytes:
    """
    Convert .doc -> .docx using LibreOffice headless.
    Requires LibreOffice (soffice) installed & on PATH.
    Returns the new .docx bytes.
    """
    with tempfile.TemporaryDirectory() as td:
        in_path = os.path.join(td, "in.doc")
        out_dir = td
        with open(in_path, "wb") as f:
            f.write(raw_bytes)

        # soffice --headless --convert-to docx --outdir <outdir> <infile>
        subprocess.run(
            ["soffice", "--headless", "--convert-to", "docx", "--outdir", out_dir, in_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        out_path = os.path.join(td, "in.docx")
        with open(out_path, "rb") as f:
            return f.read()

@parse_instructions_bp.route("/parse-instructions", methods=["POST"])
def parse_instructions():
    try:
        f = request.files.get("file")
        if not f or not f.filename:
            return jsonify({"error": "file is required"}), 400

        _, ext = os.path.splitext(f.filename)
        ext = ext.lower()
        if ext not in ALLOWED:
            return jsonify({"error": f"Unsupported file type: {ext}"}), 415

        raw = f.read()
        text = ""

        if ext == ".txt":
            text = raw.decode("utf-8", errors="ignore")

        elif ext == ".pdf":
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)

        elif ext == ".docx":
            doc = Document(io.BytesIO(raw))
            text = "\n".join(p.text for p in doc.paragraphs)

        elif ext == ".doc":
            # Option A: reject with a clear message
            # return jsonify({"error": ".doc is not supported; please upload .docx or PDF"}), 415

            # Option B: auto-convert to docx using LibreOffice, then parse
            try:
                docx_bytes = _convert_doc_to_docx(raw)
                doc = Document(io.BytesIO(docx_bytes))
                text = "\n".join(p.text for p in doc.paragraphs)
            except Exception:
                return jsonify({"error": ".doc conversion failed. Please upload DOCX or PDF."}), 415

        return jsonify({"instructions": _normalize(text)}), 200

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Conversion tool not available (LibreOffice). Install it or upload DOCX/PDF."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
