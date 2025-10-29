from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from server.db.base import Base
from datetime import datetime

class Analisis(Base):
    __tablename__ = "analisis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    emotion = Column(String(50), nullable=False)
    confidence = Column(DECIMAL(5, 4), nullable=False)
    emotions_data = Column(JSONB, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    # Relaciones
    user = relationship("User", backref="analisis")
    playlists = relationship("Playlist", back_populates="analisis", cascade="all, delete-orphan")
