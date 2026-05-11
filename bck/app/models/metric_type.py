from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MetricType(Base):
    __tablename__ = "metric_types"

    code: Mapped[str] = mapped_column(String(200), primary_key=True)
    name: Mapped[str] = mapped_column(String(240), index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("metric_type_categories.id", ondelete="RESTRICT"), index=True)
    data_type: Mapped[str] = mapped_column(String(40))
    unit: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    category = relationship("MetricTypeCategory", back_populates="metric_types")
    values = relationship("MunicipalityMetricValue", back_populates="metric_type")
