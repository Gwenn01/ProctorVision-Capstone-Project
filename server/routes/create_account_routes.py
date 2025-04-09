from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta
from database.connection import get_db_connection  
import bcrypt  

create_account_bp = Blueprint('create_account', __name__)  # Ensure this matches your import in app.py

@create_account_bp.route("/create_account", methods=["POST"])
def create_account():
    data = request.get_json()

    required_fields = ["id", "name", "username", "email", "password", "userType"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check for existing user
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash password
        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())

        # Insert user
        cursor.execute("""
            INSERT INTO users (user_id, name, username, email, password, user_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["id"],
            data["name"],
            data["username"],
            data["email"],
            hashed_pw.decode('utf-8'),
            data["userType"]
        ))

        conn.commit()
        conn.close()

        # Create token
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
