from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.department import Department
from app.models.municipality import Municipality
from app.schemas.municipality import MunicipalityCreate, MunicipalityUpdate


def list_municipalities(
    db: Session,
    *,
    include_inactive: bool = True,
    department_code: str | None = None,
) -> list[Municipality]:
    stmt = select(Municipality).order_by(Municipality.code)
    if not include_inactive:
        stmt = stmt.where(Municipality.is_active.is_(True))
    if department_code:
        stmt = stmt.where(Municipality.department_code == department_code)
    return list(db.scalars(stmt))


def get_municipality_by_code(db: Session, code: str) -> Municipality:
    stmt = select(Municipality).where(Municipality.code == code)
    muni = db.scalar(stmt)
    if muni is None:
        raise AppError(status_code=404, message="Municipio no encontrado.", code="municipality_not_found")
    return muni


def create_municipality(db: Session, payload: MunicipalityCreate) -> Municipality:
    existing = db.scalar(select(Municipality).where(Municipality.code == payload.code))
    if existing is not None:
        raise AppError(status_code=409, message="El código de municipio ya existe.", code="municipality_exists")

    dept = db.get(Department, payload.department_code)
    if dept is None:
        raise AppError(
            status_code=422, message="El departamento indicado no existe.", code="department_not_found",
        )

    muni = Municipality(**payload.model_dump())
    db.add(muni)
    db.commit()
    db.refresh(muni)
    return muni


def update_municipality(db: Session, code: str, payload: MunicipalityUpdate) -> Municipality:
    muni = get_municipality_by_code(db, code)

    data = payload.model_dump(exclude_unset=True)
    if "department_code" in data:
        dept = db.get(Department, data["department_code"])
        if dept is None:
            raise AppError(
                status_code=422, message="El departamento indicado no existe.", code="department_not_found",
            )

    for field, value in data.items():
        setattr(muni, field, value)
    db.commit()
    db.refresh(muni)
    return muni
