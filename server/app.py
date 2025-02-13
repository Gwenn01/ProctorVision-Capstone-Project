from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, jwt_required, JWTManager

app = Flask(__name__)

# Enable CORS for all routes to allow frontend access
CORS(app)

# Secret key for JWT authentication
app.config["JWT_SECRET_KEY"] = "supersecretkey"  # Change this in production for security
jwt = JWTManager(app)

# Sample route: Public API endpoint
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})

# Route: User Login
@app.route("/api/login", methods=["POST"])
def login():
    try:
        # Ensure request contains JSON data
        if not request.is_json:
            return jsonify({"error": "Unsupported Media Type. Use 'application/json'"}), 415
        #get the data form FE
        data = request.get_json()
        
        # Extract username and password from request
        username = data.get("username")
        password = data.get("password") 

        # Simple hardcoded user authentication (replace with a database in real use)
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        if username == "gwen" and password == "mypassword":
            access_token = create_access_token(identity=username)
            return jsonify({"message": "Login successful", "token": access_token}), 200

        return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Handle unexpected errors

# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Flask runs on port 5000
