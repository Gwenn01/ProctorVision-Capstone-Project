from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta
from database.connection import get_db_connection  
import bcrypt  
from routes.utils.email_utils import send_verification_email
import uuid

create_account_bp = Blueprint('create_account', __name__)

@create_account_bp.route("/create_account", methods=["POST"])
def create_account():
    data = request.get_json()

    required_fields = ["name", "username", "email", "password", "userType"]
    if data["userType"].lower() == "student":
        required_fields += ["course", "section", "year", "status"]

    # Validate required fields
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check for duplicate username or email
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        raw_password = data["password"]
        hashed_pw = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt())
        verify_token = str(uuid.uuid4())

        # Insert new user into the users table
        cursor.execute("""
            INSERT INTO users (name, username, email, password, user_type, verify_token, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data["name"],
            data["username"],
            data["email"],
            hashed_pw,
            data["userType"],
            verify_token,
            False
        ))

        new_user_id = cursor.lastrowid

        # If student, insert into student_profiles
        if data["userType"].lower() == "student":
            cursor.execute("""
                INSERT INTO student_profiles (user_id, course, section, year, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                new_user_id,
                data["course"],
                data["section"],
                data["year"],
                data["status"]
            ))

        conn.commit()
        conn.close()

        # Compose verification URL
        verification_url = f"http://localhost:5000/api/verify?token={verify_token}"

        return jsonify({
            "message": "Account created successfully.",
            "token": verify_token,  
            "user": {
                "id": new_user_id,
                "name": data["name"],
                "username": data["username"],
                "email": data["email"],
                "userType": data["userType"]
            }
        }), 201



    except Exception as e:
        return jsonify({"error": str(e)}), 500


@create_account_bp.route("/bulk_create_students", methods=["POST"])
def bulk_create_students():
    data = request.get_json()
    students = data.get("students", [])
    meta = data.get("meta", {})

    required_meta = ["course", "section", "year", "status"]
    if not all(k in meta and meta[k] for k in required_meta):
        return jsonify({"error": "Missing course/section/year/status metadata"}), 400

    if not students:
        return jsonify({"error": "No student data provided"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        created_students = []

        for student in students:
            name = student.get("name")
            username = student.get("username")
            email = student.get("email")
            raw_password = student.get("password")

            # Skip if any essential field is missing
            if not all([name, username, email, raw_password]):
                continue

            # Skip if username or email already exists
            cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                continue

            hashed_pw = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt())
            verify_token = str(uuid.uuid4())

            # Insert into users table
            cursor.execute("""
                INSERT INTO users (name, username, email, password, user_type, verify_token, is_verified)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                name,
                username,
                email,
                hashed_pw,
                "Student",
                verify_token,
                False
            ))

            user_id = cursor.lastrowid

            # Insert into student_profiles table
            cursor.execute("""
                INSERT INTO student_profiles (user_id, course, section, year, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                user_id,
                meta["course"],
                meta["section"],
                meta["year"],
                meta["status"]
            ))

            # Append student info to return for frontend email sending
            created_students.append({
                "name": name,
                "email": email,
                "username": username,
                "password": raw_password,
                "verify_token": verify_token
            })

        conn.commit()
        conn.close()

        return jsonify({
            "message": f"{len(created_students)} students added.",
            "created_students": created_students
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
