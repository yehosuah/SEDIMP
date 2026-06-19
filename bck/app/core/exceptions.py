from typing import Any

from starlette.exceptions import HTTPException


class AppError(HTTPException):
    """Application error carrying a stable machine-readable ``code``.

    Mirrors the error contract used across the team's services so the frontend
    can branch on ``code`` instead of parsing human messages.
    """

    def __init__(
        self,
        status_code: int,
        message: str,
        code: str = "app_error",
        errors: list[Any] | None = None,
    ) -> None:
        self.code = code
        self.errors = errors or []
        super().__init__(status_code=status_code, detail=message)


def build_error_payload(error: Exception) -> dict[str, Any]:
    detail = getattr(error, "detail", None)
    message = detail if isinstance(detail, str) else "Request failed"
    return {
        "message": message,
        "code": getattr(error, "code", "request_error"),
        "errors": getattr(error, "errors", []),
    }
