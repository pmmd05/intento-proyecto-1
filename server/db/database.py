from sqlalchemy import text
from server.db.session import engine
import io

def init_db_from_sql():
    with engine.connect() as connection:
        with open("server/schema.sql", "r", encoding="utf-8") as file:
            sql_script = file.read()
            connection.execute(text(sql_script))
            connection.commit()