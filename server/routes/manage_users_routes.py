from flask import Blueprint, request, jsonify
from database.connection import get_db_connection

manage_users_bp = Blueprint('manage_users', __name__)

#  unified: Get all users or filter 
@manage_users_bp.route("/users", methods=["GET"])
def get_users():
    role = request.args.get("role")
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if role == "Student":
            cursor.execute("""
                SELECT 
                    users.id, users.name, users.username, users.email, users.user_type AS role,
                    sp.course, sp.section, sp.year, sp.status
                FROM users
                JOIN student_profiles sp ON users.id = sp.user_id
                WHERE users.user_type = %s
            """, (role,))
        elif role:
            cursor.execute("""
                SELECT id, name, username, email, user_type AS role
                FROM users
                WHERE user_type = %s
            """, (role,))
        else:
            cursor.execute("""
                SELECT id, name, username, email, user_type AS role
                FROM users
            """)

        users = cursor.fetchall()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
            
@manage_users_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Optional: delete from student_profiles first to prevent foreign key constraint
        cursor.execute("DELETE FROM student_profiles WHERE user_id = %s", (user_id,))

        # Then delete from users
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()



