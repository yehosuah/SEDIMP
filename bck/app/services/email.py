"""Outbound email.

Local/dev: every message is logged to stdout so developers can copy the
password link without any mail server.

AWS transition: when SMTP_* settings are provided, swap ``_send`` for a real
SMTP/SES delivery (e.g. smtplib over settings.smtp_host or boto3 SES). The
public function signatures below should not need to change.
"""

import logging

from app.core.config import settings

logger = logging.getLogger("sistema_epidemiologico.email")


def _send(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        # AWS transition: replace this console stub with real delivery.
        logger.info("[EMAIL STUB] to=%s | subject=%s\n%s", to_email, subject, body)
        return
    # AWS transition: implement SMTP/SES delivery here using settings.smtp_*.
    raise NotImplementedError("SMTP delivery is not wired yet; configure SES on AWS.")


def _link(path: str, token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/{path}?token={token}"


def send_password_set_email(to_email: str, token: str) -> None:
    link = _link("auth/set-password", token)
    _send(
        to_email,
        "Activa tu cuenta - Sistema Epidemiológico",
        f"Se creó una cuenta para ti. Establece tu contraseña aquí:\n{link}",
    )


def send_password_reset_email(to_email: str, token: str) -> None:
    link = _link("auth/reset-password", token)
    _send(
        to_email,
        "Restablece tu contraseña - Sistema Epidemiológico",
        f"Solicitaste restablecer tu contraseña. Usa el siguiente enlace:\n{link}",
    )
