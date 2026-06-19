from collections.abc import Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.role import ROLE_ADMIN
from app.models.user import User
from app.services.users import get_user

bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_from_request(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None,
) -> str | None:
    if bearer and bearer.scheme.lower() == "bearer":
        return bearer.credentials
    cookie_token = request.cookies.get(settings.access_cookie_name)
    if cookie_token:
        return cookie_token
    return None


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
    bearer: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User | None:
    token = _credentials_from_request(request, bearer)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None
    user = get_user(db, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_current_user(
    user: User | None = Depends(get_optional_current_user),
) -> User:
    if user is None:
        raise AppError(status_code=401, message="Authentication required.", code="authentication_required")
    return user


def require_roles(*roles: str) -> Callable[[User], User]:
    """Allow only the named roles. ``admin`` always passes (superset of access)."""

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_name == ROLE_ADMIN or current_user.role_name in roles:
            return current_user
        raise AppError(status_code=403, message="Insufficient permissions.", code="forbidden")

    return dependency
