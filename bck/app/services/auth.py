from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_purpose_token,
    decode_purpose_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthResponse
from app.services import audit, email
from app.services.users import get_user_by_email


def _aware(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _issue_session(db: Session, user: User) -> AuthResponse:
    access_token = create_access_token(user.id, user.role_name)
    refresh_token = generate_refresh_token()
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
    )
    db.add(db_token)
    db.commit()
    db.refresh(user)
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=user)


def login(db: Session, email_address: str, password: str, ip_address: str | None = None) -> AuthResponse:
    user = get_user_by_email(db, email_address)
    now = datetime.now(UTC)

    if user is None:
        audit.record(db, "auth.login_failed", detail=f"unknown_email={email_address}", ip_address=ip_address)
        raise AppError(status_code=401, message="Invalid credentials.", code="invalid_credentials")

    locked_until = _aware(user.locked_until)
    if locked_until is not None and locked_until > now:
        raise AppError(status_code=423, message="Account temporarily locked.", code="account_locked")

    if not user.is_active or not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.max_failed_logins:
            user.locked_until = now + timedelta(minutes=settings.lockout_minutes)
            user.failed_login_attempts = 0
        audit.record(
            db,
            "auth.login_failed",
            user_id=user.id,
            detail=f"attempts={user.failed_login_attempts}",
            ip_address=ip_address,
            commit=False,
        )
        db.commit()
        raise AppError(status_code=401, message="Invalid credentials.", code="invalid_credentials")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    audit.record(db, "auth.login", user_id=user.id, ip_address=ip_address, commit=False)
    return _issue_session(db, user)


def refresh_session(db: Session, refresh_token: str | None) -> AuthResponse:
    if not refresh_token:
        raise AppError(status_code=401, message="Refresh token required.", code="refresh_required")

    token_hash = hash_refresh_token(refresh_token)
    db_token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    now = datetime.now(UTC)
    if db_token is None or db_token.revoked_at is not None:
        raise AppError(status_code=401, message="Invalid refresh token.", code="invalid_refresh")
    if _aware(db_token.expires_at) <= now:
        raise AppError(status_code=401, message="Invalid refresh token.", code="invalid_refresh")

    user = db_token.user
    if not user.is_active:
        raise AppError(status_code=401, message="Inactive user.", code="inactive_user")

    db_token.revoked_at = now
    db.commit()
    db.refresh(user)
    return _issue_session(db, user)


def logout(db: Session, refresh_token: str | None) -> None:
    if not refresh_token:
        return
    token_hash = hash_refresh_token(refresh_token)
    db_token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if db_token is not None and db_token.revoked_at is None:
        db_token.revoked_at = datetime.now(UTC)
        db.commit()


def _apply_new_password(db: Session, user: User, new_password: str) -> None:
    if user.password_hash and verify_password(new_password, user.password_hash):
        raise AppError(
            status_code=400,
            message="New password cannot match the current password.",
            code="password_reuse",
        )
    user.password_hash = hash_password(new_password)
    user.is_active = True
    user.failed_login_attempts = 0
    user.locked_until = None


def set_password(db: Session, token: str, new_password: str) -> None:
    """Set the initial password from an invitation link and activate the account."""
    try:
        user_id = decode_purpose_token(token, "set_password")
    except ValueError as exc:
        raise AppError(status_code=400, message="Invalid or expired token.", code="invalid_token") from exc
    user = db.get(User, user_id)
    if user is None:
        raise AppError(status_code=404, message="User not found.", code="user_not_found")
    _apply_new_password(db, user, new_password)
    audit.record(db, "auth.password_set", user_id=user.id, commit=False)
    db.commit()


def forgot_password(db: Session, email_address: str) -> None:
    """Send a reset link. Always succeeds silently to avoid leaking which emails exist."""
    user = get_user_by_email(db, email_address)
    if user is not None and user.is_active and user.password_hash:
        token = create_purpose_token(user.id, "reset_password")
        email.send_password_reset_email(user.email, token)
        audit.record(db, "auth.password_forgot", user_id=user.id)


def reset_password(db: Session, token: str, new_password: str) -> None:
    try:
        user_id = decode_purpose_token(token, "reset_password")
    except ValueError as exc:
        raise AppError(status_code=400, message="Invalid or expired token.", code="invalid_token") from exc
    user = db.get(User, user_id)
    if user is None:
        raise AppError(status_code=404, message="User not found.", code="user_not_found")
    _apply_new_password(db, user, new_password)
    audit.record(db, "auth.password_reset", user_id=user.id, commit=False)
    db.commit()
