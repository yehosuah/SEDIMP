from pydantic import BaseModel


class DepartmentMapMarker(BaseModel):
    code: str
    name: str
    capital: str | None
    latitude: float | None
    longitude: float | None
    population: int | None
    metric_code: str | None
    metric_value: float | int | None


class DepartmentMapResponse(BaseModel):
    metric_code: str | None
    departments: list[DepartmentMapMarker]
