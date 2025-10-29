from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from server.db.session import get_db
from server.db.models.analisis import Analisis
from server.db.models.playlist import Playlist
from server.utils.auth import get_current_user_from_token
from datetime import datetime, timedelta
from typing import Dict, List
from pydantic import BaseModel

router = APIRouter(prefix="/v1/stats", tags=["statistics"])

class DashboardStats(BaseModel):
    totalAnalyses: int
    mostFrequentEmotion: str
    averageConfidence: float
    lastAnalysisDate: str | None
    emotionDistribution: Dict[str, int]
    weeklyActivity: List[int]
    topGenres: List[str]
    streak: int

class HistoryItem(BaseModel):
    id: int
    emotion: str
    confidence: float
    date: str
    tracksCount: int
    saved_to_spotify: bool = False

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene las estadísticas para el dashboard del usuario
    """
    user = get_current_user_from_token(db, authorization)

    # Obtener todos los análisis del usuario
    all_analyses = db.query(Analisis).filter(
        Analisis.user_id == user.id
    ).order_by(desc(Analisis.created_at)).all()

    total_analyses = len(all_analyses)

    # Si no hay análisis, retornar valores por defecto
    if total_analyses == 0:
        return DashboardStats(
            totalAnalyses=0,
            mostFrequentEmotion="happy",
            averageConfidence=0.0,
            lastAnalysisDate=None,
            emotionDistribution={},
            weeklyActivity=[0] * 7,
            topGenres=[],
            streak=0
        )

    # Calcular distribución de emociones
    emotion_counts = db.query(
        Analisis.emotion,
        func.count(Analisis.id).label('count')
    ).filter(
        Analisis.user_id == user.id
    ).group_by(Analisis.emotion).all()

    emotion_distribution = {emotion: count for emotion, count in emotion_counts}

    # Emoción más frecuente
    most_frequent_emotion = max(emotion_distribution, key=emotion_distribution.get) if emotion_distribution else "happy"

    # Confianza promedio
    avg_confidence = db.query(
        func.avg(Analisis.confidence)
    ).filter(
        Analisis.user_id == user.id
    ).scalar() or 0.0

    # Última fecha de análisis
    last_analysis = all_analyses[0] if all_analyses else None
    last_analysis_date = last_analysis.created_at.isoformat() if last_analysis else None

    # Actividad semanal (últimos 7 días)
    today = datetime.now().date()
    weekly_activity = []

    for i in range(7):
        day = today - timedelta(days=6-i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        count = db.query(func.count(Analisis.id)).filter(
            Analisis.user_id == user.id,
            Analisis.created_at >= day_start,
            Analisis.created_at <= day_end
        ).scalar()

        weekly_activity.append(count)

    # Calcular racha de días consecutivos
    streak = calculate_streak(all_analyses)

    # Top géneros (por ahora retornamos valores genéricos basados en las emociones)
    top_genres = get_top_genres_from_emotions(emotion_distribution)

    return DashboardStats(
        totalAnalyses=total_analyses,
        mostFrequentEmotion=most_frequent_emotion,
        averageConfidence=float(avg_confidence),
        lastAnalysisDate=last_analysis_date,
        emotionDistribution=emotion_distribution,
        weeklyActivity=weekly_activity,
        topGenres=top_genres,
        streak=streak
    )

@router.get("/history", response_model=List[HistoryItem])
def get_history(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
    emotion: str = None,
    limit: int = 50
):
    """
    Obtiene el historial de análisis del usuario
    """
    user = get_current_user_from_token(db, authorization)

    # Query base
    query = db.query(Analisis).filter(Analisis.user_id == user.id)

    # Filtrar por emoción si se especifica
    if emotion and emotion != 'all':
        query = query.filter(Analisis.emotion == emotion)

    # Ordenar por fecha descendente y limitar
    analyses = query.order_by(desc(Analisis.created_at)).limit(limit).all()

    # Convertir a respuesta
    history = []
    for analysis in analyses:
        # Contar playlists asociadas al análisis
        playlist_count = db.query(func.count(Playlist.id)).filter(
            Playlist.analisis_id == analysis.id
        ).scalar()

        # Verificar si alguna playlist fue guardada en Spotify
        saved_to_spotify = db.query(Playlist).filter(
            Playlist.analisis_id == analysis.id,
            Playlist.saved_to_spotify == True
        ).first() is not None

        history.append(HistoryItem(
            id=analysis.id,
            emotion=analysis.emotion,
            confidence=float(analysis.confidence),
            date=analysis.created_at.isoformat(),
            tracksCount=15,  # Por defecto usamos 15, esto se podría mejorar guardando el conteo
            saved_to_spotify=saved_to_spotify
        ))

    return history

def calculate_streak(analyses: List[Analisis]) -> int:
    """
    Calcula la racha de días consecutivos con análisis
    """
    if not analyses:
        return 0

    dates = sorted([a.created_at.date() for a in analyses], reverse=True)
    unique_dates = list(dict.fromkeys(dates))  # Eliminar duplicados manteniendo orden

    if not unique_dates:
        return 0

    # Verificar si el día más reciente es hoy o ayer
    today = datetime.now().date()
    if unique_dates[0] not in [today, today - timedelta(days=1)]:
        return 0

    streak = 1
    for i in range(len(unique_dates) - 1):
        diff = (unique_dates[i] - unique_dates[i + 1]).days
        if diff == 1:
            streak += 1
        else:
            break

    return streak

def get_top_genres_from_emotions(emotion_distribution: Dict[str, int]) -> List[str]:
    """
    Obtiene géneros musicales basados en las emociones más frecuentes
    """
    emotion_to_genres = {
        'happy': ['pop', 'indie', 'dance', 'funk'],
        'sad': ['indie', 'acoustic', 'ambient', 'folk'],
        'angry': ['rock', 'metal', 'punk', 'hardcore'],
        'relaxed': ['ambient', 'jazz', 'classical', 'lofi'],
        'energetic': ['electronic', 'pop', 'rock', 'dance']
    }

    # Obtener las 2 emociones más frecuentes
    sorted_emotions = sorted(emotion_distribution.items(), key=lambda x: x[1], reverse=True)
    top_emotions = [emotion for emotion, _ in sorted_emotions[:2]]

    # Recopilar géneros de esas emociones
    genres = set()
    for emotion in top_emotions:
        if emotion in emotion_to_genres:
            genres.update(emotion_to_genres[emotion][:2])

    # Retornar los primeros 4 géneros únicos
    return list(genres)[:4] if genres else ['pop', 'rock', 'indie', 'electronic']
