from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_purpose_token
from tests.factories import create_user


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_user_can_login(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "admin@example.com", role="admin")

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "Password123!"},
    )

    assert login.status_code == 200
    payload = login.json()
    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == "admin@example.com"
    assert payload["user"]["role"]["name"] == "admin"
    assert "se_access_token" in login.cookies
    assert "se_refresh_token" in login.cookies


def test_visor_can_login(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "visor@example.com", role="visor")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "visor@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    assert response.json()["user"]["role"]["name"] == "visor"


def test_login_rejects_bad_password(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "admin@example.com")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


def test_login_locks_account_after_repeated_failures(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "lock@example.com")

    for _ in range(settings.max_failed_logins):
        client.post("/api/v1/auth/login", json={"email": "lock@example.com", "password": "wrong"})

    # Even with the correct password the account is now temporarily locked.
    locked = client.post(
        "/api/v1/auth/login",
        json={"email": "lock@example.com", "password": "Password123!"},
    )
    assert locked.status_code == 423
    assert locked.json()["code"] == "account_locked"


def test_refresh_rotates_and_revokes_old_token(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "refresh@example.com")
    created = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "Password123!"},
    ).json()

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": created["refresh_token"]})
    assert refreshed.status_code == 200

    reused_old = client.post("/api/v1/auth/refresh", json={"refresh_token": created["refresh_token"]})
    assert reused_old.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient, db_session: Session) -> None:
    create_user(db_session, "logout@example.com")
    created = client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "Password123!"},
    ).json()

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": created["refresh_token"]})
    assert logout.status_code == 204

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": created["refresh_token"]})
    assert refreshed.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401


def test_inactive_user_sets_password_and_activates(client: TestClient, db_session: Session) -> None:
    user = create_user(db_session, "invited@example.com", active=False)
    # An inactive (invited) account cannot log in yet.
    pre = client.post(
        "/api/v1/auth/login",
        json={"email": "invited@example.com", "password": "Password123!"},
    )
    assert pre.status_code == 401

    token = create_purpose_token(user.id, "set_password")
    set_resp = client.post(
        "/api/v1/auth/password/set",
        json={"token": token, "new_password": "BrandNew123!"},
    )
    assert set_resp.status_code == 200

    after = client.post(
        "/api/v1/auth/login",
        json={"email": "invited@example.com", "password": "BrandNew123!"},
    )
    assert after.status_code == 200


def test_forgot_password_is_silent_for_unknown_email(client: TestClient) -> None:
    response = client.post("/api/v1/auth/password/forgot", json={"email": "nobody@example.com"})
    assert response.status_code == 200
