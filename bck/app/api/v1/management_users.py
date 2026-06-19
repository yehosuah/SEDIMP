from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.role import ROLE_ADMIN
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services import users

# User administration is admin-only.
router = APIRouter(prefix="/users", tags=["management"])


@router.get("", response_model=list[UserRead], summary="Listar usuarios")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    """Lista todos los usuarios del sistema."""
    return users.list_users(db)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Crear usuario")
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ROLE_ADMIN)),
):
    """Crea un usuario inactivo y envía una invitación para establecer su contraseña."""
    return users.create_user(db, payload, current_user)


@router.patch("/{user_id}", response_model=UserRead, summary="Actualizar usuario")
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ROLE_ADMIN)),
):
    """Actualiza el rol, nombre o estado de activación de un usuario."""
    return users.update_user(db, user_id, payload, current_user)
