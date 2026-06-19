from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.role import Role
from app.models.user import User


def create_user(db: Session, email: str, role: str = "admin", *, active: bool = True) -> User:
    role_row = db.scalar(select(Role).where(Role.name == role))
    user = User(
        email=email,
        password_hash=hash_password("Password123!"),
        role_id=role_row.id,
        is_active=active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_token(user: User) -> str:
    return create_access_token(user.id, user.role_name)
