from pydantic import BaseModel, EmailStr, Field, validator

class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=8, max_length=72, description="Contraseña debe tener entre 8 y 72 caracteres")
    
    @validator('password')
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('La contraseña no puede exceder 72 bytes')
        return v


class UserResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    message: str | None = None   # Campo opcional para mensajes adicionales


    class Config:
        from_attributes = True