from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricTypeCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    is_active: bool = True


class MetricTypeCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    is_active: bool | None = None


class MetricTypeCategoryRead(BaseModel):
    id: str
    name: str
    is_active: bool
    metric_type_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
