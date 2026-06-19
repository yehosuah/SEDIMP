from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.role import RoleRead


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None
    role: RoleRead
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    """Admin-driven creation. No password is set here; the user receives an
    invitation email and chooses their own password, which activates the account."""

    email: EmailStr
    full_name: str | None = Field(default=None, max_length=160)
    role_id: int


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=160)
    role_id: int | None = None
    is_active: bool | None = None
