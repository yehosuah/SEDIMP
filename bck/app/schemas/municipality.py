from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MunicipalityBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    department_code: str = Field(min_length=1, max_length=8)
    population: int | None = Field(default=None, ge=0)
    area_km2: float | None = Field(default=None, gt=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    altitude: float | None = Field(default=None, ge=0)
    is_active: bool = True


class MunicipalityCreate(MunicipalityBase):
    code: str = Field(pattern=r"^[0-9A-Za-z_-]{1,16}$")


class MunicipalityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    department_code: str | None = Field(default=None, min_length=1, max_length=8)
    population: int | None = Field(default=None, ge=0)
    area_km2: float | None = Field(default=None, gt=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    altitude: float | None = Field(default=None, ge=0)
    is_active: bool | None = None


class MunicipalityRead(MunicipalityBase):
    id: int
    code: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MunicipalitySummary(BaseModel):
    code: str
    name: str
    department_code: str

    model_config = ConfigDict(from_attributes=True)
