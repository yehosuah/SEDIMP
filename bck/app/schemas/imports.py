from typing import Any

from pydantic import BaseModel, Field


class MunicipalityDataRecords(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)


class ImportFieldAnalysis(BaseModel):
    field: str
    sample_values: list[str]
    detected_type: str
    mapped_metric_code: str | None = None


class MunicipalityDataAnalysis(BaseModel):
    total_records: int
    total_fields: int
    fields: list[ImportFieldAnalysis]


class MunicipalityDataImportRequest(MunicipalityDataRecords):
    municipality_field: str = Field(min_length=1)
    department_field: str = Field(min_length=1)
    mappings: dict[str, str] = Field(min_length=1)


class MunicipalityDataImportSummary(BaseModel):
    total_records: int
    mapped_fields: int
    metric_values: int
    skipped_values: int


class ImportTemplate(BaseModel):
    records: list[dict[str, Any]]
