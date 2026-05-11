from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.municipality_metric_value import MunicipalityMetricValue
from app.schemas.map import DepartmentMapMarker, DepartmentMapResponse


def list_department_map_data(db: Session, metric_code: str | None = None) -> DepartmentMapResponse:
    departments = list(db.scalars(select(Department).where(Department.is_active.is_(True)).order_by(Department.code)))
    values_by_department: dict[str, float] = {}

    if metric_code:
        rows = db.execute(
            select(MunicipalityMetricValue.department_code, func.sum(MunicipalityMetricValue.value))
            .where(MunicipalityMetricValue.metric_type_code == metric_code)
            .group_by(MunicipalityMetricValue.department_code)
        )
        values_by_department = {department_code: value for department_code, value in rows}

    markers = []
    for department in departments:
        metric_value = values_by_department.get(department.code) if metric_code else department.population
        markers.append(
            DepartmentMapMarker(
                code=department.code,
                name=department.name,
                capital=department.capital,
                latitude=department.latitude,
                longitude=department.longitude,
                population=department.population,
                metric_code=metric_code,
                metric_value=metric_value,
            )
        )

    return DepartmentMapResponse(metric_code=metric_code, departments=markers)
