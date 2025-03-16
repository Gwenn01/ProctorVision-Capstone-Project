from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Secret key for JWT authentication
app.config["JWT_SECRET_KEY"] = "supersecretkey"  # Change this in production
jwt = JWTManager(app)

# Import blueprints
from routes.auth_routes import auth_bp
from routes.video_routes import video_bp
from routes.classification_routes import classification_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(video_bp, url_prefix='/api')
app.register_blueprint(classification_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
