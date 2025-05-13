import bcrypt
import mysql.connector

# Database connection
from connection import get_db_connection  
conn = get_db_connection()
cursor = conn.cursor()

# List of (name, username) tuples
users = [
    ("Melojean C. Marave", "melojean"),
    ("Carl Angelo S. Pamploma", "carl"),
    ("Geoffrey S. Sepillo", "geoffrey"),
    ("Hansel S. Ada", "hansel"),
    ("John Lenon E. Agatep", "john"),
    ("Israel M. Cabasug", "israel"),
    ("Niemea M. Galang", "niemea"),
    ("Jason S. Arates", "jason"),
    ("Fiel M. Dullas", "fiel"),
    ("Darwin M. Morana", "darwin"),
    ("Ronnel M. Mesia", "ronnel"),
    ("May Ann A. Acera", "may"),
    ("Joseph J. Juliano", "joseph"),
    ("Daniel A. Bachillar", "daniel"),
    ("Darly John Ragadio", "darly"),
    ("Eufemia Sion", "eufemia"),
    ("Marionne Joyce F. Tapado", "marionne"),
    ("Rowela Gongora", "rowela"),
    ("Joseph S. Cortez", "joseph2"),
    ("King Myer Mantolino", "king"),
    ("Jamil Tan Elamparo", "jamil"),
    ("Rowena Orboc", "rowena"),
    ("Hicel Mae Mas", "hicel"),
    ("Karen Quintoriano", "karen"),
    ("Ashley Rambuyong", "ashley"),
    ("Kie Ann Josafat", "kie"),
    ("Jio Erika Pelinio", "jio"),
    ("Dane Nalicat", "dane"),
    ("Radowena Payumo", "radowena"),
    ("Michael G. Albino", "michael"),
    ("Apple Escalante", "apple"),
    ("Katherine Uy", "katherine"),
]

# Insert each instructor with hashed password
for name, username in users:
    email = f"{username}@email.com"
    raw_password = f"{username}123"
    hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt())

    cursor.execute("""
        INSERT INTO users (name, username, email, password, user_type)
        VALUES (%s, %s, %s, %s, %s)
    """, (name, username, email, hashed_password, "Instructor"))

conn.commit()
cursor.close()
conn.close()
