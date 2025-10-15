from fastapi import APIRouter, Depends, Query, Header, HTTPException
from server.controllers.recommend_controller import recommend_songs_by_emotion
import requests


router = APIRouter(prefix="/recommend", tags=["recommendations"])

@router.get("/")
def get_recommendations(
    emotion: str = Query(...),
    authorization: str = Header(..., alias="Authorization")  # ✅ CORREGIDO
):
    """
    Devuelve una lista de canciones recomendadas según la emoción.
    - emotion: happy, sad, angry, relaxed, energetic
    - authorization: Header Authorization con formato "Bearer TU_TOKEN"
    """
    # Verificar que el header Authorization esté presente y tenga el formato correcto
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Token inválido o ausente. Formato requerido: 'Bearer TU_TOKEN'"
        )

    # Extraer el token (quitar "Bearer ")
    token = authorization.split(" ")[1].strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="Token vacío")

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
