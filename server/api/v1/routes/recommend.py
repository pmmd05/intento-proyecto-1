from fastapi import APIRouter, Depends, Query, Header, HTTPException, Request
from sqlalchemy.orm import Session
from server.controllers.recommend_controller import recommend_songs_by_emotion
from server.services.spotify import create_playlist
from server.db.session import get_db
from server.db.models.playlist import Playlist
from server.utils.auth import get_current_user_from_token
from pydantic import BaseModel
import requests
import json
import os
import random

router = APIRouter(prefix="/recommend", tags=["recommendations"])


class CreatePlaylistRequest(BaseModel):
    emotion: str
    track_uris: list
    analisis_id: int = None  # ID del análisis asociado (opcional)

@router.get("/")
def get_recommendations(
    request: Request,
    emotion: str = Query(...),
    authorization: str = Header(None, alias="Authorization")
):
    """
    Devuelve una lista de canciones recomendadas según la emoción.
    - emotion: happy, sad, angry, relaxed, energetic
    - authorization: Header Authorization con formato "Bearer TU_TOKEN"
    """
    token = None

    # Prefer Authorization header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

    # If no header token, attempt to retrieve httpOnly cookie set by OAuth callback
    if not token:
        cookie_token = request.cookies.get('spotify_access_token')
        if cookie_token:
            token = cookie_token

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o ausente. Envíe Authorization header o configure Spotify (conexión)."
        )

    return recommend_songs_by_emotion(token, emotion)


@router.get("/test-spotify")
def test_spotify_connection(access_token: str = Query(...)):
    """
    Endpoint temporal para probar la conexión con Spotify
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Probar un endpoint simple de Spotify primero
    test_url = "https://api.spotify.com/v1/me"
    
    try:
        response = requests.get(test_url, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            return {
                "status": "success", 
                "user": user_data.get("display_name", "Unknown"),
                "email": user_data.get("email", "Unknown")
            }
        else:
            return {
                "status": "error",
                "status_code": response.status_code,
                "error": response.text
            }
    except Exception as e:
        return {"status": "exception", "error": str(e)}


# ============================================
# 🎵 ENDPOINTS MOCKUP
# ============================================

def load_mock_data():
    """Cargar datos mockup desde el JSON"""
    json_path = os.path.join(os.path.dirname(__file__), '../../../../recomendacionesSpotify.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return generate_fallback_data()

def generate_fallback_data():
    """Datos de respaldo si no se encuentra el JSON"""
    return {
        "tracks": [
            {
                "name": "Happy Song",
                "artists": [{"name": "Artist Name"}],
                "album": {
                    "name": "Album Name",
                    "images": [{"url": "https://via.placeholder.com/300"}]
                },
                "external_urls": {"spotify": "https://open.spotify.com"},
                "duration_ms": 180000,
                "popularity": 75
            }
        ] * 10,
        "emotion": "happy",
        "total_tracks": 10,
        "search_method": "fallback"
    }

# Mapeo de emociones a diferentes conjuntos de canciones
EMOTION_TRACK_FILTERS = {
    "happy": lambda tracks: tracks[:30],
    "sad": lambda tracks: tracks[:30],
    "angry": lambda tracks: tracks[:30],
    "relaxed": lambda tracks: tracks[:30],
    "energetic": lambda tracks: tracks[:30]
}

@router.get("/mockup")
def get_mockup_recommendations(emotion: str = Query(...)):
    """
    🎵 Devuelve recomendaciones musicales MOCKUP
    
    No requiere autenticación ni configuración de Spotify.
    Usa datos del archivo recomendacionesSpotify.json
    """
    emotion = emotion.lower()
    
    if emotion not in EMOTION_TRACK_FILTERS:
        raise HTTPException(
            status_code=400,
            detail=f"Emoción inválida. Opciones: {', '.join(EMOTION_TRACK_FILTERS.keys())}"
        )
    
    # Cargar datos
    mock_data = load_mock_data()
    all_tracks = mock_data.get("tracks", [])
    
    if not all_tracks:
        raise HTTPException(
            status_code=500,
            detail="No se pudieron cargar las canciones mockup"
        )
    
    # Aplicar filtro según emoción y aleatorizar
    random.shuffle(all_tracks)
    filter_func = EMOTION_TRACK_FILTERS[emotion]
    selected_tracks = filter_func(all_tracks)
    
    return {
        "tracks": selected_tracks,
        "emotion": emotion,
        "total_tracks": len(selected_tracks),
        "search_method": "mockup",
        "mockup_mode": True
    }


@router.get("/test-mockup")
def test_mockup():
    """
    🧪 Prueba que el sistema mockup funcione
    """
    try:
        data = load_mock_data()
        return {
            "status": "ok",
            "tracks_available": len(data.get("tracks", [])),
            "emotions": list(EMOTION_TRACK_FILTERS.keys()),
            "note": "Sistema mockup funcionando correctamente"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/create-playlist")
def create_spotify_playlist(
    request: Request,
    body: CreatePlaylistRequest,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Crea una playlist en Spotify con las canciones proporcionadas.
    Requiere que el usuario esté autenticado con Spotify.

    - emotion: Emoción detectada (para el nombre de la playlist)
    - track_uris: Lista de URIs de Spotify (ej: ["spotify:track:abc123", ...])
    - analisis_id: ID del análisis asociado (opcional)
    """
    # Obtener usuario autenticado
    user = get_current_user_from_token(db, authorization)

    # Obtener token de Spotify del cookie
    spotify_token = request.cookies.get('spotify_access_token')

    if not spotify_token:
        raise HTTPException(
            status_code=401,
            detail="Debes conectar tu cuenta de Spotify para guardar playlists"
        )

    if not body.track_uris:
        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar al menos una canción para crear la playlist"
        )

    # Llamar al servicio para crear la playlist en Spotify
    result = create_playlist(spotify_token, body.emotion, body.track_uris)

    if not result.get("success"):
        error_message = result.get("message", "Error desconocido")

        # Si el token expiró, devolver error 401
        if result.get("error") == "token_expired":
            raise HTTPException(status_code=401, detail=error_message)

        # Para otros errores, devolver 500
        raise HTTPException(status_code=500, detail=error_message)

    # Guardar la playlist en la BD
    playlist = Playlist(
        analisis_id=body.analisis_id,
        user_id=user.id,
        emotion=body.emotion,
        name=result.get("playlist_name", f"Playlist {body.emotion}"),
        spotify_id=result.get("playlist_id"),
        spotify_url=result.get("playlist_url"),
        track_count=len(body.track_uris),
        saved_to_spotify=True
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)

    result["db_playlist_id"] = playlist.id

    return result