from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship
from server.db.base import Base

class Playlist(Base):
    __tablename__ = "playlist"

    id = Column(Integer, primary_key=True, index=True)
    analisis_id = Column(Integer, ForeignKey("analisis.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    emotion = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False)
    spotify_id = Column(String(100), nullable=True)
    spotify_url = Column(String, nullable=True)
    track_count = Column(Integer, default=0)
    saved_to_spotify = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    # Relaciones
    user = relationship("User", backref="playlists")
    analisis = relationship("Analisis", back_populates="playlists")
