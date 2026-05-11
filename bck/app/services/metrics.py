from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.metric_type import MetricType
from app.models.metric_type_category import MetricTypeCategory
from app.schemas.metric_type import MetricTypeCreate, MetricTypeRead, MetricTypeUpdate
from app.schemas.metric_type_category import (
    MetricTypeCategoryCreate,
    MetricTypeCategoryRead,
    MetricTypeCategoryUpdate,
)


def _category_read(category: MetricTypeCategory, metric_type_count: int) -> MetricTypeCategoryRead:
    return MetricTypeCategoryRead(
        id=category.id,
        name=category.name,
        is_active=category.is_active,
        metric_type_count=metric_type_count,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


def _metric_type_read(metric_type: MetricType) -> MetricTypeRead:
    return MetricTypeRead(
        code=metric_type.code,
        name=metric_type.name,
        category_id=metric_type.category_id,
        category_name=metric_type.category.name,
        data_type=metric_type.data_type,
        unit=metric_type.unit,
        is_active=metric_type.is_active,
        created_at=metric_type.created_at,
        updated_at=metric_type.updated_at,
    )


def list_categories(db: Session, include_inactive: bool = True) -> list[MetricTypeCategoryRead]:
    stmt = (
        select(MetricTypeCategory, func.count(MetricType.code))
        .outerjoin(MetricType, MetricType.category_id == MetricTypeCategory.id)
        .group_by(MetricTypeCategory.id)
        .order_by(MetricTypeCategory.name)
    )
    if not include_inactive:
        stmt = stmt.where(MetricTypeCategory.is_active.is_(True))
    return [_category_read(category, count) for category, count in db.execute(stmt)]


def create_category(db: Session, payload: MetricTypeCategoryCreate) -> MetricTypeCategoryRead:
    existing = db.scalar(select(MetricTypeCategory).where(MetricTypeCategory.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Metric type category already exists.")

    category = MetricTypeCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return _category_read(category, 0)


def update_category(db: Session, category_id: str, payload: MetricTypeCategoryUpdate) -> MetricTypeCategoryRead:
    category = db.get(MetricTypeCategory, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric type category not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    count = db.scalar(select(func.count(MetricType.code)).where(MetricType.category_id == category.id)) or 0
    return _category_read(category, count)


def delete_category(db: Session, category_id: str) -> None:
    category = db.get(MetricTypeCategory, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric type category not found.")
    count = db.scalar(select(func.count(MetricType.code)).where(MetricType.category_id == category.id)) or 0
    if count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category has metric types.")

    db.delete(category)
    db.commit()


def list_metric_types(
    db: Session,
    category_id: str | None = None,
    search: str | None = None,
    include_inactive: bool = True,
) -> list[MetricTypeRead]:
    stmt = select(MetricType).join(MetricType.category).order_by(MetricType.name)
    if category_id:
        stmt = stmt.where(MetricType.category_id == category_id)
    if search:
        query = f"%{search.lower()}%"
        stmt = stmt.where(or_(func.lower(MetricType.name).like(query), func.lower(MetricType.code).like(query)))
    if not include_inactive:
        stmt = stmt.where(MetricType.is_active.is_(True), MetricTypeCategory.is_active.is_(True))
    return [_metric_type_read(metric_type) for metric_type in db.scalars(stmt)]


def create_metric_type(db: Session, payload: MetricTypeCreate) -> MetricTypeRead:
    if db.get(MetricType, payload.code) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Metric type already exists.")
    if db.get(MetricTypeCategory, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric type category not found.")

    metric_type = MetricType(**payload.model_dump())
    db.add(metric_type)
    db.commit()
    db.refresh(metric_type)
    return _metric_type_read(metric_type)


def update_metric_type(db: Session, code: str, payload: MetricTypeUpdate) -> MetricTypeRead:
    metric_type = db.get(MetricType, code)
    if metric_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric type not found.")

    updates = payload.model_dump(exclude_unset=True)
    category_id = updates.get("category_id")
    if category_id and db.get(MetricTypeCategory, category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric type category not found.")

    for field, value in updates.items():
        setattr(metric_type, field, value)
    db.commit()
    db.refresh(metric_type)
    return _metric_type_read(metric_type)
