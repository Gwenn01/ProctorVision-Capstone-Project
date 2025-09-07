# services/behavior_service.py
from database.connection import get_db_connection
import threading

def save_behavior_log(user_id: int, exam_id: int, image_base64: str, warning_type: str):
    """Persist a behavior log. Returns inserted row id when available."""
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor()
        row_id = None
        try:
            # Postgres path (supports RETURNING)
            cur.execute(
                """
                INSERT INTO suspicious_behavior_logs (user_id, exam_id, image_base64, warning_type)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, exam_id, image_base64, warning_type),
            )
            row = cur.fetchone()
            if row:
                row_id = row[0]
        except Exception:
            # Fallback for MySQL/MariaDB (no RETURNING)
            cur.execute(
                """
                INSERT INTO suspicious_behavior_logs (user_id, exam_id, image_base64, warning_type)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, exam_id, image_base64, warning_type),
            )
            try:
                row_id = getattr(cur, "lastrowid", None)
            except Exception:
                row_id = None

        conn.commit()
        return row_id
    except Exception:
        conn.rollback()
        raise
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

def save_behavior_log_async(user_id: int, exam_id: int, image_base64: str, warning_type: str, on_error=None):
    """Fire-and-forget background insert so the WebRTC loop never blocks."""
    def _worker():
        try:
            save_behavior_log(user_id, exam_id, image_base64, warning_type)
        except Exception as e:
            if on_error:
                on_error(e)
    threading.Thread(target=_worker, daemon=True).start()
