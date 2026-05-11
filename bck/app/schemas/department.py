from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    capital: str | None = Field(default=None, max_length=160)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    population: int | None = Field(default=None, ge=0)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    code: str = Field(pattern=r"^[0-9A-Za-z_-]{1,8}$")


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    capital: str | None = Field(default=None, max_length=160)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    population: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class DepartmentRead(DepartmentBase):
    code: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
