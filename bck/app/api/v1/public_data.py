from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.department import DepartmentRead
from app.schemas.map import DepartmentMapResponse
from app.schemas.metric_type import MetricTypeRead
from app.schemas.municipality import MunicipalityRead
from app.services import departments, map_data, metrics, municipalities

router = APIRouter()


@router.get("/departments", response_model=list[DepartmentRead])
def list_public_departments(db: Session = Depends(get_db)):
    return departments.list_departments(db, include_inactive=False)


@router.get("/metric-types", response_model=list[MetricTypeRead])
def list_public_metric_types(
    with_data: bool = Query(False, description="Si es true, solo devuelve tipos de métrica que tengan al menos un valor registrado."),
    db: Session = Depends(get_db),
):
    return metrics.list_metric_types(db, include_inactive=False, with_data=with_data)


@router.get(
    "/municipalities",
    response_model=list[MunicipalityRead],
    summary="Listar municipios activos (público)",
)
def list_public_municipalities(
    department_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return municipalities.list_municipalities(
        db, include_inactive=False, department_code=department_code,
    )


@router.get(
    "/municipalities/{code}",
    response_model=MunicipalityRead,
    summary="Obtener municipio por código (público)",
)
def get_public_municipality(code: str, db: Session = Depends(get_db)):
    return municipalities.get_municipality_by_code(db, code)


@router.get("/map/departments", response_model=DepartmentMapResponse)
def list_department_map_data(
    metric_code: str | None = None,
    db: Session = Depends(get_db),
):
    return map_data.list_department_map_data(db, metric_code=metric_code)
