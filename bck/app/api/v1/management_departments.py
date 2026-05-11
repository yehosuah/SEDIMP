from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import require_manager
from app.db.session import get_db
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.services import departments

router = APIRouter(dependencies=[Depends(require_manager())])


@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    return departments.list_departments(db)


@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
):
    return departments.create_department(db, payload)


@router.patch("/departments/{code}", response_model=DepartmentRead)
def update_department(
    code: str,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
):
    return departments.update_department(db, code, payload)
