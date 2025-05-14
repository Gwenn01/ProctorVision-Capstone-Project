from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from database.connection import get_db_connection
from datetime import timedelta
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        if not request.is_json:
            return jsonify({"error": "Unsupported Media Type. Use 'application/json'"}), 415

        req_data = request.get_json()
        username = req_data.get("username")
        password = req_data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # === Check Admin Table ===
        cursor.execute("SELECT * FROM admin WHERE username = %s", (username,))
        admin = cursor.fetchone()
        if admin:
            stored_hash = str(admin['password']).strip()
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                token = create_access_token(
                    identity=admin['username'],
                    expires_delta=timedelta(days=1)
                )
                return jsonify({
                    "message": "Login successful",
                    "username": admin['username'],
                    "name": admin['name'],
                    "role": "Admin",
                    "token": token
                }), 200
            else:
                return jsonify({"error": "Invalid username or password"}), 401

        # === Check Users Table (Instructor / Student) ===
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if user:
            stored_hash = str(user['password']).strip()
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                if user['user_type'] == 'Student':
                    cursor.execute(
                        "UPDATE instructor_assignments SET is_login = 1 WHERE student_id = %s",
                        (user['id'],)
                    )
                    conn.commit()

                token = create_access_token(
                    identity=user['username'],
                    expires_delta=timedelta(days=1)
                )
                return jsonify({
                    "message": "Login successful",
                    "id": user['id'],
                    "username": user['username'],
                    "name": user['name'],
                    "role": user['user_type'],  # "Instructor" or "Student"
                    "token": token
                }), 200
            else:
                return jsonify({"error": "Invalid username or password"}), 401

        return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        print("Login error:", str(e))
        return jsonify({"error": "Server error. Please try again."}), 500

    finally:
        if 'conn' in locals():
            conn.close()
            
@auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        req_data = request.get_json()
        student_id = req_data.get("student_id")

        if not student_id:
            return jsonify({"error": "Missing student_id"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE instructor_assignments SET is_login = 0 WHERE student_id = %s",
            (student_id,)
        )
        conn.commit()
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

