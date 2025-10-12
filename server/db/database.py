import os
from sqlalchemy import text
from server.db.session import engine

# Compute absolute path to schema.sql so it works regardless of CWD
SCHEMA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "schema.sql",
)

def init_db_from_sql():
    """Initialize the database by executing the SQL script at startup.

    Uses an absolute path and UTF-8 encoding to avoid Windows path/encoding issues.
    """
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"schema.sql no encontrado en: {SCHEMA_PATH}")

    # Use engine.begin() for implicit commit/rollback handling
    with engine.begin() as connection:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as file:
            sql_script = file.read()
            connection.execute(text(sql_script))