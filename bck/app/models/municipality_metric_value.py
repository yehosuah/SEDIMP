from __future__ import annotations

from datetime import datetime
import uuid

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, DateTime, Float, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MunicipalityMetricValue(Base):
    __tablename__ = "municipality_metric_values"
    __table_args__ = (
        UniqueConstraint(
            "department_code",
            "municipality_name",
            "metric_type_code",
            name="uq_municipality_metric_values_identity",
        ),
        UniqueConstraint(
            "municipality_id",
            "metric_type_code",
            name="uq_municipality_metric_values_municipality_metric",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_code: Mapped[str] = mapped_column(ForeignKey("departments.code", ondelete="CASCADE"), index=True)
    municipality_id: Mapped[int | None] = mapped_column(
        ForeignKey("municipalities.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    municipality_name: Mapped[str] = mapped_column(String(160), index=True)
    metric_type_code: Mapped[str] = mapped_column(
        String(200),
        ForeignKey("metric_types.code", ondelete="CASCADE"),
        index=True,
    )
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    numeric_value: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True, index=True)
    unit: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_updated: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    department = relationship("Department", back_populates="metric_values")
    municipality = relationship("Municipality", back_populates="metric_values")
    metric_type = relationship("MetricType", back_populates="values")
