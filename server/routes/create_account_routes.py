from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta
from database.connection import get_db_connection  
import bcrypt  

create_account_bp = Blueprint('create_account', __name__)

@create_account_bp.route("/create_account", methods=["POST"])
def create_account():
    data = request.get_json()

    required_fields = ["id", "name", "username", "email", "password", "userType"]
    # Only require course/section for students
    if data["userType"].lower() == "student":
        required_fields += ["course", "section"]

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check for existing user
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash the password
        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())

        # Insert user into users table
        cursor.execute("""
            INSERT INTO users (user_id, name, username, email, password, user_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["id"],
            data["name"],
            data["username"],
            data["email"],
            hashed_pw,
            data["userType"]
        ))

        # If user is a student, insert into student_profiles
        if data["userType"].lower() == "student":
            cursor.execute("""
                INSERT INTO student_profiles (user_id, course, section)
                VALUES (%s, %s, %s)
            """, (
                data["id"],
                data["course"],
                data["section"]
            ))

        conn.commit()
        conn.close()

        # Generate token
        token = create_access_token(identity=data["username"], expires_delta=timedelta(days=1))

        return jsonify({
            "message": f"{data['userType']} account created successfully",
            "token": token,
            "user": {
                "id": data["id"],
                "name": data["name"],
                "username": data["username"],
                "email": data["email"],
                "userType": data["userType"]
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
