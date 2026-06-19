from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.role import Role
from tests.factories import auth_token, create_user


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_list_roles(client: TestClient, db_session: Session) -> None:
    admin = create_user(db_session, "admin@example.com", role="admin")
    response = client.get("/api/v1/management/roles", headers=_headers(auth_token(admin)))
    assert response.status_code == 200
    names = {r["name"] for r in response.json()}
    assert {"admin", "editor", "visor"} <= names


def test_visor_cannot_list_users(client: TestClient, db_session: Session) -> None:
    visor = create_user(db_session, "visor@example.com", role="visor")
    response = client.get("/api/v1/management/users", headers=_headers(auth_token(visor)))
    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


def test_admin_creates_user_inactive_and_audited(client: TestClient, db_session: Session) -> None:
    admin = create_user(db_session, "admin@example.com", role="admin")
    editor_role = db_session.scalar(select(Role).where(Role.name == "editor"))

    response = client.post(
        "/api/v1/management/users",
        headers=_headers(auth_token(admin)),
        json={"email": "new@example.com", "full_name": "New User", "role_id": editor_role.id},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["is_active"] is False
    assert body["role"]["name"] == "editor"

    actions = set(db_session.scalars(select(AuditLog.action)))
    assert "user.created" in actions


def test_editor_cannot_create_user(client: TestClient, db_session: Session) -> None:
    editor = create_user(db_session, "editor@example.com", role="editor")
    role = db_session.scalar(select(Role).where(Role.name == "visor"))
    response = client.post(
        "/api/v1/management/users",
        headers=_headers(auth_token(editor)),
        json={"email": "x@example.com", "role_id": role.id},
    )
    assert response.status_code == 403
