from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.controllers.auth_controller import register_user, login_user
from server.services.spotify import get_spotify_auth_url, get_spotify_token
import secrets

from server.core.security import verify_token
from server.db.models.user import User

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

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Header
from server.core.security import verify_token
from server.db.models.user import User

# ... código existente ...

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene información del usuario autenticado actual
    """
    try:
        # Verificar formato del header
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de token inválido"
            )
        
        # Extraer token
        token = authorization.split(" ")[1]
        
        # Verificar token y obtener email
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Buscar usuario en la base de datos
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserResponse.from_orm(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información del usuario"
        )
