from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.department import DepartmentRead
from app.schemas.map import DepartmentMapResponse
from app.schemas.metric_type import MetricTypeRead
from app.services import departments, map_data, metrics

router = APIRouter()


@router.get("/departments", response_model=list[DepartmentRead])
def list_public_departments(db: Session = Depends(get_db)):
    return departments.list_departments(db, include_inactive=False)


@router.get("/metric-types", response_model=list[MetricTypeRead])
def list_public_metric_types(db: Session = Depends(get_db)):
    return metrics.list_metric_types(db, include_inactive=False)


@router.get("/map/departments", response_model=DepartmentMapResponse)
def list_department_map_data(
    metric_code: str | None = None,
    db: Session = Depends(get_db),
):
    return map_data.list_department_map_data(db, metric_code=metric_code)
