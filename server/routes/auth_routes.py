from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

# Sample user data (Replace with a database in production)
users = {
    "Admin": {"username": "admin", "password": "admin123", "role": "Admin"},
    "Instructor": {"username": "instructor", "password": "instructor123", "role": "Instructor"},
    "Student": {"username": "student", "password": "student123", "role": "Student"}
}

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

        for user_key, user_info in users.items():
            if username == user_info["username"] and password == user_info["password"]:
                access_token = create_access_token(identity=username)
                return jsonify({"username": username, "role": user_info["role"], "token": access_token}), 200

        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
