from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth import require_manager
from app.db.session import get_db
from app.schemas.metric_type import MetricTypeCreate, MetricTypeRead, MetricTypeUpdate
from app.schemas.metric_type_category import (
    MetricTypeCategoryCreate,
    MetricTypeCategoryRead,
    MetricTypeCategoryUpdate,
)
from app.services import metrics

router = APIRouter(dependencies=[Depends(require_manager())])


@router.get("/metric-type-categories", response_model=list[MetricTypeCategoryRead])
def list_metric_type_categories(db: Session = Depends(get_db)):
    return metrics.list_categories(db)


@router.post(
    "/metric-type-categories",
    response_model=MetricTypeCategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_metric_type_category(
    payload: MetricTypeCategoryCreate,
    db: Session = Depends(get_db),
):
    return metrics.create_category(db, payload)


@router.patch("/metric-type-categories/{category_id}", response_model=MetricTypeCategoryRead)
def update_metric_type_category(
    category_id: str,
    payload: MetricTypeCategoryUpdate,
    db: Session = Depends(get_db),
):
    return metrics.update_category(db, category_id, payload)


@router.delete("/metric-type-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric_type_category(
    category_id: str,
    db: Session = Depends(get_db),
):
    metrics.delete_category(db, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/metric-types", response_model=list[MetricTypeRead])
def list_metric_types(
    category_id: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    return metrics.list_metric_types(db, category_id=category_id, search=search)


@router.post("/metric-types", response_model=MetricTypeRead, status_code=status.HTTP_201_CREATED)
def create_metric_type(
    payload: MetricTypeCreate,
    db: Session = Depends(get_db),
):
    return metrics.create_metric_type(db, payload)


@router.patch("/metric-types/{code}", response_model=MetricTypeRead)
def update_metric_type(
    code: str,
    payload: MetricTypeUpdate,
    db: Session = Depends(get_db),
):
    return metrics.update_metric_type(db, code, payload)
