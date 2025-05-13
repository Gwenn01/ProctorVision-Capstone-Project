from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta
from database.connection import get_db_connection  
import bcrypt  

create_account_bp = Blueprint('create_account', __name__)

@create_account_bp.route("/create_account", methods=["POST"])
def create_account():
    data = request.get_json()

    required_fields = ["name", "username", "email", "password", "userType"]
    if data["userType"].lower() == "student":
        required_fields += ["course", "section", "year", "status"]

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check for existing username/email
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash password
        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())

        # Insert user (let id auto-increment)
        cursor.execute("""
            INSERT INTO users (name, username, email, password, user_type)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data["name"],
            data["username"],
            data["email"],
            hashed_pw,
            data["userType"]
        ))

        # Get the auto-generated user ID
        new_user_id = cursor.lastrowid

        # Insert into student_profiles if student
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

        token = create_access_token(identity=data["username"], expires_delta=timedelta(days=1))

        return jsonify({
            "message": f"{data['userType']} account created successfully",
            "token": token,
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

        for student in students:
            name = student.get("name")
            username = student.get("username")
            email = student.get("email")
            raw_password = student.get("password")

            if not all([name, username, email, raw_password]):
                continue  # skip incomplete rows

            # Check for duplicates
            cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                continue  # skip duplicates

            # Hash password
            hashed_pw = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt())

            # Insert into users
            cursor.execute("""
                INSERT INTO users (name, username, email, password, user_type)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, username, email, hashed_pw, "Student"))
            user_id = cursor.lastrowid

            # Insert into student_profiles
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

        conn.commit()
        conn.close()
        return jsonify({"message": "Bulk student import successful!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
