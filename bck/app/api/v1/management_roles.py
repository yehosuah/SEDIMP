from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.role import ROLE_ADMIN, Role
from app.models.user import User
from app.schemas.role import RoleRead

router = APIRouter(prefix="/roles", tags=["management"])


@router.get("", response_model=list[RoleRead], summary="Listar roles")
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    """Lista los roles disponibles para asignar a usuarios."""
    return list(db.scalars(select(Role).order_by(Role.id)))
