from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.controllers.auth_controller import register_user, login_user
from server.services.spotify import get_spotify_auth_url, get_spotify_token
import secrets


router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user)

@router.post("/login", response_model=TokenResponse,status_code=status.HTTP_200_OK)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)


@router.get("/spotify")
def spotify_auth(state: str = Query(...)):
    """
    Redirige a Spotify para autenticación
    El frontend genera el state y lo pasa como query parameter
    """
    print("State recibido del frontend:", state)
    
    auth_url = get_spotify_auth_url(state)
    return RedirectResponse(auth_url)

@router.get("/spotify/callback")
def spotify_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: str = Query(None)
):
    """
    Callback de Spotify después de la autenticación
    """
    if error:
        raise HTTPException(status_code=400, detail=f"Error de Spotify: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorización no recibido")
    
    print("State recibido de Spotify:", state)
    
    # En este caso, el frontend es responsable de validar el state
    
    try:
        token_data = get_spotify_token(code=code)
        
        return {
            "message": "Autenticación exitosa",
            "access_token": token_data.get("access_token"),
            "token_type": token_data.get("token_type"),
            "expires_in": token_data.get("expires_in"),
            "refresh_token": token_data.get("refresh_token"),
            "scope": token_data.get("scope")
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
