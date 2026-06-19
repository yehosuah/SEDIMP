from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "sistemaEpidemiologico API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://app:app@localhost:5432/sistema_epidemiologico"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    cookie_secure: bool = False
    cookie_domain: str | None = None
    access_cookie_name: str = "se_access_token"
    refresh_cookie_name: str = "se_refresh_token"
    cors_origins: str = "http://localhost:3000"

    # Account lockout after repeated failed logins.
    max_failed_logins: int = 5
    lockout_minutes: int = 15

    # Basic per-key rate limiting on auth endpoints.
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 60
    forgot_password_rate_limit: int = 3
    forgot_password_rate_window_seconds: int = 86_400

    # Password set/reset tokens delivered by email link.
    password_token_ttl_hours: int = 48
    # Base URL the email links point at (the frontend route that posts the token back).
    frontend_url: str = "http://localhost:5173"

    # Bootstrap account created at startup. The env vars keep the historical
    # MANAGER_* names for compatibility with existing .env / docker-compose,
    # but the seeded user is assigned the "admin" role.
    auto_create_manager: bool = False
    manager_email: str | None = None
    manager_password: str | None = None

    # AWS transition: replace the console email sender with SES/SMTP by setting
    # these in the environment. Empty values keep the local console-logging stub.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "no-reply@sistema-epidemiologico.local"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("cookie_domain", mode="before")
    @classmethod
    def blank_cookie_domain_is_none(cls, value: str | None) -> str | None:
        if value == "":
            return None
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
