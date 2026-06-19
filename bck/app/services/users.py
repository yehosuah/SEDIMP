from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import create_purpose_token
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services import audit, email


def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email_address: str) -> User | None:
    return db.scalar(select(User).where(User.email == email_address.lower()))


def _get_role(db: Session, role_id: int) -> Role:
    role = db.get(Role, role_id)
    if role is None:
        raise AppError(status_code=404, message="Role not found.", code="role_not_found")
    return role


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


def create_user(db: Session, payload: UserCreate, actor: User) -> User:
    """Create an inactive user and send an invitation to set their password."""
    _get_role(db, payload.role_id)
    if get_user_by_email(db, payload.email) is not None:
        raise AppError(status_code=400, message="Email already registered.", code="email_taken")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        role_id=payload.role_id,
        password_hash=None,
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_purpose_token(user.id, "set_password")
    email.send_password_set_email(user.email, token)
    audit.record(
        db,
        "user.created",
        user_id=actor.id,
        entity_type="user",
        entity_id=user.id,
        detail=f"role_id={payload.role_id}",
    )
    return user


def update_user(db: Session, user_id: str, payload: UserUpdate, actor: User) -> User:
    user = get_user(db, user_id)
    if user is None:
        raise AppError(status_code=404, message="User not found.", code="user_not_found")

    if payload.role_id is not None:
        _get_role(db, payload.role_id)
        user.role_id = payload.role_id
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    audit.record(
        db,
        "user.updated",
        user_id=actor.id,
        entity_type="user",
        entity_id=user.id,
        detail=payload.model_dump_json(exclude_none=True),
    )
    return user
