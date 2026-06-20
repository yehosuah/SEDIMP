from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.role import ROLE_ADMIN, ROLE_EDITOR
from app.schemas.municipality import MunicipalityCreate, MunicipalityRead, MunicipalityUpdate
from app.services import municipalities

router = APIRouter(dependencies=[Depends(require_roles(ROLE_ADMIN, ROLE_EDITOR))])


@router.get(
    "/municipalities",
    response_model=list[MunicipalityRead],
    summary="Listar municipios (gestión)",
)
def list_municipalities(
    department_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return municipalities.list_municipalities(db, department_code=department_code)


@router.get(
    "/municipalities/{code}",
    response_model=MunicipalityRead,
    summary="Obtener municipio por código (gestión)",
)
def get_municipality(code: str, db: Session = Depends(get_db)):
    return municipalities.get_municipality_by_code(db, code)


@router.post(
    "/municipalities",
    response_model=MunicipalityRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear municipio",
)
def create_municipality(
    payload: MunicipalityCreate,
    db: Session = Depends(get_db),
):
    return municipalities.create_municipality(db, payload)


@router.patch(
    "/municipalities/{code}",
    response_model=MunicipalityRead,
    summary="Actualizar municipio",
)
def update_municipality(
    code: str,
    payload: MunicipalityUpdate,
    db: Session = Depends(get_db),
):
    return municipalities.update_municipality(db, code, payload)
