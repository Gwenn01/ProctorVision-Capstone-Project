# db.py
import mysql.connector

# Create and return a MySQL connection
def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="gwen0701",
        database="proctorvision_db"
    )
    return connection
