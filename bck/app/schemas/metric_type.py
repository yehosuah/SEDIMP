from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricTypeCreate(BaseModel):
    code: str = Field(pattern=r"^[A-Z0-9][A-Z0-9_]{0,79}$")
    name: str = Field(min_length=1, max_length=160)
    category_id: str = Field(min_length=1, max_length=36)
    data_type: str = Field(pattern=r"^(integer|decimal|percentage|currency|string)$")
    unit: str | None = Field(default=None, max_length=80)
    is_active: bool = True


class MetricTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    category_id: str | None = Field(default=None, min_length=1, max_length=36)
    data_type: str | None = Field(default=None, pattern=r"^(integer|decimal|percentage|currency|string)$")
    unit: str | None = Field(default=None, max_length=80)
    is_active: bool | None = None


class MetricTypeRead(BaseModel):
    code: str
    name: str
    category_id: str
    category_name: str
    data_type: str
    unit: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
