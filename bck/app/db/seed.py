from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.role import DEFAULT_ROLES, ROLE_ADMIN, Role
from app.models.user import User


def ensure_roles(db: Session) -> None:
    """Idempotently create the canonical roles (admin / editor / visor)."""
    existing = {name for name in db.scalars(select(Role.name))}
    created = False
    for name, description in DEFAULT_ROLES:
        if name not in existing:
            db.add(Role(name=name, description=description))
            created = True
    if created:
        db.commit()


def ensure_admin(db: Session) -> User | None:
    """Bootstrap the initial admin account from MANAGER_EMAIL / MANAGER_PASSWORD."""
    if not settings.manager_email or not settings.manager_password:
        return None

    ensure_roles(db)
    admin_role = db.scalar(select(Role).where(Role.name == ROLE_ADMIN))
    if admin_role is None:
        return None

    email = settings.manager_email.lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        if existing.role_id != admin_role.id:
            existing.role_id = admin_role.id
            db.commit()
            db.refresh(existing)
        return existing

    user = User(
        email=email,
        password_hash=hash_password(settings.manager_password),
        role_id=admin_role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
