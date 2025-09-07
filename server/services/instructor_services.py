# services/instructor_service.py increment if the suspicous capture 
from database.connection import get_db_connection
import threading
import sys

def _find_instructor_id_for_student(conn, student_id: int):
    """
    Return an instructor_id for this student.
    Adjust the query if your schema is different (e.g., join to exams).
    """
    cur = conn.cursor()
    try:
        # If you can have multiple assignments, pick the latest.
        cur.execute(
            """
            SELECT instructor_id
            FROM instructor_assignments
            WHERE student_id = %s
            ORDER BY id DESC
            LIMIT 1
            """,
            (student_id,),
        )
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        cur.close()

def increment_suspicious(student_id: int, instructor_id: int) -> int:
    """Direct bump: requires instructor_id; returns affected rows."""
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE instructor_assignments
            SET suspicious_behavior_count = suspicious_behavior_count + 1
            WHERE student_id = %s AND instructor_id = %s
            """,
            (student_id, instructor_id),
        )
        conn.commit()
        return cur.rowcount
    except Exception:
        try: conn.rollback()
        except Exception: pass
        raise
    finally:
        try: cur.close()
        except Exception: pass
        conn.close()

def increment_suspicious_for_student(student_id: int) -> int:
    """
    Convenience: look up instructor_id for the student and bump the count.
    Returns affected rows (0 if no assignment found).
    """
    conn = get_db_connection()
    cur = None
    try:
        iid = _find_instructor_id_for_student(conn, student_id)
        if iid is None:
            return 0
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE instructor_assignments
            SET suspicious_behavior_count = suspicious_behavior_count + 1
            WHERE student_id = %s AND instructor_id = %s
            """,
            (student_id, iid),
        )
        conn.commit()
        return cur.rowcount
    except Exception:
        try: conn.rollback()
        except Exception: pass
        raise
    finally:
        try: cur.close()
        except Exception: pass
        conn.close()

def increment_suspicious_for_student_async(student_id: int, on_error=None):
    """Fire-and-forget background increment."""
    def _worker():
        try:
            increment_suspicious_for_student(student_id)
        except Exception as e:
            if on_error: on_error(e)
            else: print(f"[INCR_SUSPICIOUS_ERR] {e}", file=sys.stderr, flush=True)
    threading.Thread(target=_worker, daemon=True).start()
