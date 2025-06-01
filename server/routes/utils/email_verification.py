from flask import Blueprint, request, jsonify
from database.connection import get_db_connection
from flask import redirect

email_verification_bp = Blueprint("email_verification", __name__)

@email_verification_bp.route("/verify", methods=["GET"])
def verify_account():
    token = request.args.get("token")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE verify_token = %s", (token,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Invalid or expired token"}), 400

        cursor.execute("""
            UPDATE users
            SET is_verified = TRUE, verify_token = NULL
            WHERE verify_token = %s
        """, (token,))
        conn.commit()

        # Redirect to frontend React success page
        return redirect("http://localhost:3000/verify-success")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()