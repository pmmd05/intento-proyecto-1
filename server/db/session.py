from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import make_url
from server.core.config import settings

# Normalize the DB URL and prefer psycopg3 on Postgres if available
raw_url = settings.DATABASE_URL.strip()
url = make_url(raw_url)
if url.drivername.startswith("postgresql") and "+" not in url.drivername:
    try:
        import psycopg  # noqa: F401
        url = url.set(drivername="postgresql+psycopg")
    except Exception:
        # psycopg3 not available; keep default (likely psycopg2)
        pass

engine = create_engine(
    url,
    pool_pre_ping=True,
    echo=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()