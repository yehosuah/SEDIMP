from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def list_departments(db: Session, include_inactive: bool = True) -> list[Department]:
    stmt = select(Department).order_by(Department.code)
    if not include_inactive:
        stmt = stmt.where(Department.is_active.is_(True))
    return list(db.scalars(stmt))


def create_department(db: Session, payload: DepartmentCreate) -> Department:
    if db.get(Department, payload.code) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department already exists.")

    department = Department(**payload.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def update_department(db: Session, code: str, payload: DepartmentUpdate) -> Department:
    department = db.get(Department, code)
    if department is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(department, field, value)
    db.commit()
    db.refresh(department)
    return department
