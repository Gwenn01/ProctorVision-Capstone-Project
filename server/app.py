from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, JWTManager

app = Flask(__name__)

# Enable CORS for API security
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Sample user data (Replace with a database in production)
users = {
    "Admin": {
        "username": "admin",
        "password": "admin123",
        "role": "Admin"
    },
    "Instructor": {
        "username": "instructor",
        "password": "instructor123",
        "role": "Instructor"
    },
    "Student": {
        "username": "student",
        "password": "student123",
        "role": "Student"
    }
}

# Secret key for JWT authentication
app.config["JWT_SECRET_KEY"] = "supersecretkey"  # Change this in production
jwt = JWTManager(app)

# Public API Route
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})

# User Login Route
@app.route("/api/login", methods=["POST"])
def login():
    try:
        # Ensure request contains JSON data
        if not request.is_json:
            return jsonify({"error": "Unsupported Media Type. Use 'application/json'"}), 415

        # Get data from request
        req_data = request.get_json()
        username = req_data.get("username")
        password = req_data.get("password")

        # Validate input
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # Check credentials against the user database
        for user_key, user_info in users.items():
            if username == user_info["username"] and password == user_info["password"]:
                # Generate JWT token
                access_token = create_access_token(identity=username)
                
                # Return user role and token
                return jsonify({
                    "username": username,
                    "role": user_info["role"],
                    "token": access_token
                }), 200

        return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Handle unexpected errors

# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Flask runs on port 5000
