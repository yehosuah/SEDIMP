from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import require_manager
from app.db.session import get_db
from app.schemas.imports import (
    ImportTemplate,
    MunicipalityDataAnalysis,
    MunicipalityDataImportRequest,
    MunicipalityDataImportSummary,
    MunicipalityDataRecords,
)
from app.services import imports

router = APIRouter(dependencies=[Depends(require_manager())])


@router.get("/imports/municipality-data/template", response_model=ImportTemplate)
def get_municipality_data_template():
    return imports.get_municipality_data_template()


@router.post("/imports/municipality-data/analyze", response_model=MunicipalityDataAnalysis)
def analyze_municipality_data(
    payload: MunicipalityDataRecords,
    db: Session = Depends(get_db),
):
    return imports.analyze_municipality_data(db, payload.records)


@router.post("/imports/municipality-data/preview", response_model=MunicipalityDataImportSummary)
def preview_municipality_data_import(
    payload: MunicipalityDataImportRequest,
    db: Session = Depends(get_db),
):
    return imports.preview_municipality_data_import(db, payload)


@router.post(
    "/imports/municipality-data",
    response_model=MunicipalityDataImportSummary,
    status_code=status.HTTP_201_CREATED,
)
def import_municipality_data(
    payload: MunicipalityDataImportRequest,
    db: Session = Depends(get_db),
):
    return imports.import_municipality_data(db, payload)
