from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core import rate_limit
from app.core.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    EmailRequest,
    LoginRequest,
    MessageResponse,
    PasswordChange,
    PasswordReset,
    PasswordSet,
    RefreshRequest,
)
from app.schemas.user import UserRead
from app.services import auth as auth_service

router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    cookie_args = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "domain": settings.cookie_domain,
    }
    response.set_cookie(
        settings.access_cookie_name,
        access_token,
        max_age=settings.access_token_ttl_minutes * 60,
        **cookie_args,
    )
    response.set_cookie(
        settings.refresh_cookie_name,
        refresh_token,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
        **cookie_args,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(settings.access_cookie_name, domain=settings.cookie_domain)
    response.delete_cookie(settings.refresh_cookie_name, domain=settings.cookie_domain)


@router.post("/login", response_model=AuthResponse, summary="Iniciar sesión")
def login(
    request: LoginRequest,
    http_request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Autentica al usuario y emite tokens de acceso y refresco."""
    ip_address = http_request.client.host if http_request.client else None
    rate_limit.enforce(
        f"login:{ip_address or 'unknown'}",
        settings.login_rate_limit,
        settings.login_rate_window_seconds,
    )
    auth_payload = auth_service.login(db, request.email, request.password, ip_address)
    _set_auth_cookies(response, auth_payload.access_token, auth_payload.refresh_token)
    return auth_payload


@router.post("/refresh", response_model=AuthResponse, summary="Refrescar sesión")
def refresh(
    request: RefreshRequest,
    http_request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Rota el token de refresco y emite un nuevo token de acceso."""
    refresh_token = request.refresh_token or http_request.cookies.get(settings.refresh_cookie_name)
    auth_payload = auth_service.refresh_session(db, refresh_token)
    _set_auth_cookies(response, auth_payload.access_token, auth_payload.refresh_token)
    return auth_payload


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Cerrar sesión")
def logout(
    request: RefreshRequest,
    http_request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> None:
    """Revoca el token de refresco y limpia las cookies de sesión."""
    refresh_token = request.refresh_token or http_request.cookies.get(settings.refresh_cookie_name)
    auth_service.logout(db, refresh_token)
    _clear_auth_cookies(response)


@router.get("/me", response_model=UserRead, summary="Perfil del usuario actual")
def me(current_user: User = Depends(get_current_user)) -> User:
    """Devuelve el perfil del usuario autenticado."""
    return current_user


@router.post("/password/set", response_model=MessageResponse, summary="Establecer contraseña")
def set_password(data: PasswordSet, db: Session = Depends(get_db)) -> MessageResponse:
    """Establece la contraseña inicial desde la invitación y activa la cuenta."""
    auth_service.set_password(db, data.token, data.new_password)
    return MessageResponse(message="Contraseña establecida correctamente.")


@router.post("/password/forgot", response_model=MessageResponse, summary="Recuperar contraseña")
def forgot_password(data: EmailRequest, db: Session = Depends(get_db)) -> MessageResponse:
    """Envía un enlace de restablecimiento si el correo existe."""
    rate_limit.enforce(
        f"forgot:{data.email.lower()}",
        settings.forgot_password_rate_limit,
        settings.forgot_password_rate_window_seconds,
    )
    auth_service.forgot_password(db, data.email)
    return MessageResponse(message="Si el correo existe, se envió un enlace de restablecimiento.")


@router.post("/password/change", response_model=MessageResponse, summary="Cambiar contraseña")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Cambia la contraseña del usuario autenticado y revoca sus otras sesiones."""
    auth_service.change_password(db, current_user, data.current_password, data.new_password)
    return MessageResponse(message="Contraseña actualizada correctamente.")


@router.post("/password/reset", response_model=MessageResponse, summary="Restablecer contraseña")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)) -> MessageResponse:
    """Restablece la contraseña usando el token enviado por correo."""
    auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Contraseña restablecida correctamente.")
