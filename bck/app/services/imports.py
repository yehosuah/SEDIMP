from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.metric_type import MetricType
from app.models.municipality_metric_value import MunicipalityMetricValue
from app.schemas.imports import (
    ImportFieldAnalysis,
    ImportTemplate,
    MunicipalityDataAnalysis,
    MunicipalityDataImportRequest,
    MunicipalityDataImportSummary,
)


def get_municipality_data_template() -> ImportTemplate:
    return ImportTemplate(
        records=[
            {
                "municipio": "Guatemala",
                "departamento": "01",
                "pob_total": 923392,
                "idhm_2018": 0.792,
            }
        ]
    )


def _detect_type(values: list[Any]) -> str:
    present = [value for value in values if value is not None]
    if not present:
        return "string"
    if all(isinstance(value, bool) for value in present):
        return "string"
    if all(isinstance(value, int) and not isinstance(value, bool) for value in present):
        return "integer"
    if all(isinstance(value, int | float) and not isinstance(value, bool) for value in present):
        return "percentage" if all(0 <= float(value) <= 1 for value in present) else "decimal"
    return "string"


def analyze_municipality_data(db: Session, records: list[dict[str, Any]]) -> MunicipalityDataAnalysis:
    fields = list(dict.fromkeys(field for record in records for field in record))
    metric_types = {metric.name.lower(): metric.code for metric in db.scalars(select(MetricType))}
    metric_types.update({metric.code.lower(): metric.code for metric in db.scalars(select(MetricType))})

    analysis = []
    for field in fields:
        values = [record.get(field) for record in records]
        samples = [str(value) for value in values[:2] if value is not None]
        analysis.append(
            ImportFieldAnalysis(
                field=field,
                sample_values=samples,
                detected_type=_detect_type(values),
                mapped_metric_code=metric_types.get(field.lower()),
            )
        )

    return MunicipalityDataAnalysis(total_records=len(records), total_fields=len(fields), fields=analysis)


def preview_municipality_data_import(
    db: Session,
    payload: MunicipalityDataImportRequest,
) -> MunicipalityDataImportSummary:
    return _process_municipality_data_import(db, payload, persist=False)


def import_municipality_data(
    db: Session,
    payload: MunicipalityDataImportRequest,
) -> MunicipalityDataImportSummary:
    return _process_municipality_data_import(db, payload, persist=True)


def _process_municipality_data_import(
    db: Session,
    payload: MunicipalityDataImportRequest,
    persist: bool,
) -> MunicipalityDataImportSummary:
    _validate_payload_shape(payload)
    _validate_metric_codes(db, payload)

    metric_values = 0
    skipped_values = 0
    for record in payload.records:
        department_code = str(record[payload.department_field])
        municipality_name = str(record[payload.municipality_field])
        department = db.get(Department, department_code)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department {department_code} does not exist.",
            )

        for field, metric_code in payload.mappings.items():
            value = record.get(field)
            if value is None or isinstance(value, bool) or not isinstance(value, int | float):
                skipped_values += 1
                continue
            metric_values += 1
            if persist:
                _upsert_metric_value(db, department_code, municipality_name, metric_code, float(value))

    if persist:
        db.commit()

    return MunicipalityDataImportSummary(
        total_records=len(payload.records),
        mapped_fields=len(payload.mappings),
        metric_values=metric_values,
        skipped_values=skipped_values,
    )


def _validate_payload_shape(payload: MunicipalityDataImportRequest) -> None:
    for field in [payload.department_field, payload.municipality_field, *payload.mappings.keys()]:
        if any(field not in record for record in payload.records):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Field {field} is missing.")


def _validate_metric_codes(db: Session, payload: MunicipalityDataImportRequest) -> None:
    for metric_code in payload.mappings.values():
        if db.get(MetricType, metric_code) is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Metric type {metric_code} does not exist.",
            )


def _upsert_metric_value(
    db: Session,
    department_code: str,
    municipality_name: str,
    metric_type_code: str,
    value: float,
) -> None:
    existing = db.scalar(
        select(MunicipalityMetricValue).where(
            MunicipalityMetricValue.department_code == department_code,
            MunicipalityMetricValue.municipality_name == municipality_name,
            MunicipalityMetricValue.metric_type_code == metric_type_code,
        )
    )
    if existing:
        existing.value = value
        return

    db.add(
        MunicipalityMetricValue(
            department_code=department_code,
            municipality_name=municipality_name,
            metric_type_code=metric_type_code,
            value=value,
        )
    )
