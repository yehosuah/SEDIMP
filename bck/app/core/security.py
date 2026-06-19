from datetime import UTC, datetime, timedelta
import hashlib
import secrets
from typing import Any

import jwt

from app.core.config import settings

PASSWORD_ITERATIONS = 260_000
PASSWORD_ALGORITHM = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"{PASSWORD_ALGORITHM}${PASSWORD_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        algorithm, iterations, salt, digest = password_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != PASSWORD_ALGORITHM:
        return False
    candidate = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return secrets.compare_digest(candidate, digest)


def create_access_token(subject: str, role: str) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid access token.") from exc
    if payload.get("type") != "access":
        raise ValueError("Invalid token type.")
    return payload


def create_purpose_token(subject: str, purpose: str) -> str:
    """Short-lived signed token used for password set/reset email links."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "purpose": purpose,
        "iat": now,
        "exp": now + timedelta(hours=settings.password_token_ttl_hours),
        "type": "purpose",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_purpose_token(token: str, expected_purpose: str) -> str:
    """Return the subject of a purpose token, or raise ValueError if invalid."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid token.") from exc
    if payload.get("type") != "purpose" or payload.get("purpose") != expected_purpose:
        raise ValueError("Invalid token purpose.")
    subject = payload.get("sub")
    if not subject:
        raise ValueError("Invalid token subject.")
    return subject


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
