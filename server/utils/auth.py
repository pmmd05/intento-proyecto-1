from fastapi import HTTPException, Header
from sqlalchemy.orm import Session
from server.core.security import verify_token
from server.db.models.user import User
from jose import JWTError

def get_current_user_from_token(
    db: Session,
    authorization: str = None
) -> User:
    """
    Obtiene el usuario actual desde el token JWT
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o ausente"
        )

    try:
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )

        # Buscar usuario en la BD
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no encontrado"
            )

        return user

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
