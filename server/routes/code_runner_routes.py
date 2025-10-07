import os
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

#  Load .env variables
load_dotenv()

code_runner_bp = Blueprint("code_runner", __name__)

#  RapidAPI Judge0 CE endpoint
JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions"

#  Load API key from .env file
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

#  Headers for RapidAPI
HEADERS = {
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    "x-rapidapi-key": RAPIDAPI_KEY,
    "content-type": "application/json"
}

#  Supported languages
LANGUAGES = {
    "python": 71,     # Python 3
    "cpp": 54,        # C++ (GCC 9.2.0)
    "java": 62,       # Java (OpenJDK 13)
    "javascript": 63, # Node.js
    "php": 68         # PHP
}


@code_runner_bp.route("/run_code", methods=["POST"])
def run_code():
    """Run submitted code using RapidAPI Judge0 CE"""
    data = request.get_json()
    code = data.get("code", "")
    lang = data.get("language", "python").lower()

    lang_id = LANGUAGES.get(lang, 71)

    # ✅ Build payload
    payload = {
        "language_id": lang_id,
        "source_code": code,
        "stdin": ""
    }

    try:
        # ✅ Submit code for execution
        response = requests.post(
            f"{JUDGE0_URL}?base64_encoded=false&wait=true",
            json=payload,
            headers=HEADERS,
            timeout=15
        )

        # Check if the response is valid JSON
        try:
            result = response.json()
        except Exception:
            return jsonify({"output": "❌ Invalid JSON response from Judge0"}), 500

        # ✅ Handle normal output
        output = (
            result.get("stdout")
            or result.get("stderr")
            or result.get("compile_output")
            or "⚠️ No output returned."
        )

        return jsonify({"output": output.strip()}), 200

    except Exception as e:
        print("Error running code:", e)
        return jsonify({"output": f"❌ Error: {str(e)}"}), 500


@code_runner_bp.route("/test_env", methods=["GET"])
def test_env():
    """Check if .env is working properly"""
    key_exists = bool(RAPIDAPI_KEY)
    return jsonify({
        "env_loaded": key_exists,
        "using_api": "RapidAPI Judge0 CE",
        "message": " Environment loaded correctly!" if key_exists else "⚠️ RAPIDAPI_KEY not found"
    })
