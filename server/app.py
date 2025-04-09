from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database.connection import get_db_connection

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "supersecretkey"
jwt = JWTManager(app)

# Test DB connection
@app.route("/test_connection", methods=["GET"])
def test_connection():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE();")
        current_db = cursor.fetchone()
        conn.close()
        return jsonify({"message": f"Connected to database: {current_db[0]}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Import and register routes
from routes.create_account_routes import create_account_bp
from routes.auth_routes import auth_bp
from routes.video_routes import video_bp
from routes.classification_routes import classification_bp

app.register_blueprint(create_account_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(video_bp, url_prefix='/api')
app.register_blueprint(classification_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
