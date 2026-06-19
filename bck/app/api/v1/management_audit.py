from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.role import ROLE_ADMIN
from app.models.user import User
from app.schemas.audit import AuditLogRead
from app.services import audit

router = APIRouter(prefix="/audit-logs", tags=["management"])


@router.get("", response_model=list[AuditLogRead], summary="Consultar bitácora de auditoría")
def list_audit_logs(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    """Devuelve los eventos de auditoría más recientes."""
    return audit.list_logs(db, limit=limit, offset=offset)
