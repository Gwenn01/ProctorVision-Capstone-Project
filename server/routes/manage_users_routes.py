from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

manage_users_bp = Blueprint('manage_users', __name__)

#  unified: Get all users or filter by role
@manage_users_bp.route("/users", methods=["GET"])
def get_users():
    role = request.args.get("role")
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if role:
            cursor.execute("""
                SELECT id, user_id, name, username, email, user_type AS role
                FROM users
                WHERE user_type = %s
            """, (role,))
        else:
            cursor.execute("""
                SELECT id, user_id, name, username, email, user_type AS role
                FROM users
            """)

        users = cursor.fetchall()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Update user
@manage_users_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET name = %s, username = %s, email = %s
            WHERE id = %s
        """, (data["name"], data["username"], data["email"], user_id))
        conn.commit()
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# Delete user
@manage_users_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
            

