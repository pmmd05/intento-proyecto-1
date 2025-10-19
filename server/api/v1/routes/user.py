from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserResponse, UserUpdate, ChangePassword
from server.controllers.user_controller import get_user_by_id, update_user_profile, change_user_password
from server.core.security import verify_token
from jose import JWTError

router = APIRouter(prefix="/v1/user", tags=["Users"])

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_by_id(db, user_id)


# Actualizar perfil
@router.patch("/profile", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Actualiza el perfil del usuario autenticado
    """
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Formato de token inválido"
            )
        
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )
        
        return update_user_profile(db, email, user_data)
        
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )


# Cambiar contraseña
@router.post("/change-password")
def update_password(
    password_data: ChangePassword,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Cambia la contraseña del usuario autenticado
    """
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Formato de token inválido"
            )
        
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )
        
        return change_user_password(db, email, password_data)
        
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )