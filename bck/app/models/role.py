from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Canonical role names. Authorization is granted by role name across the API.
ROLE_ADMIN = "admin"
ROLE_EDITOR = "editor"
ROLE_VISOR = "visor"

DEFAULT_ROLES: list[tuple[str, str]] = [
    (ROLE_ADMIN, "Control total del sistema y administración de usuarios."),
    (ROLE_EDITOR, "Carga datos, crea, edita y publica indicadores."),
    (ROLE_VISOR, "Acceso autenticado de solo lectura para análisis."),
]


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    users = relationship("User", back_populates="role")
