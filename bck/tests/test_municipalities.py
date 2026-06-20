from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.municipality import Municipality
from tests.factories import auth_token, create_user


def _seed_department(db: Session, code: str = "GT-01", name: str = "Guatemala") -> Department:
    dept = Department(code=code, name=name, is_active=True)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def _seed_municipality(
    db: Session,
    code: str = "0101",
    name: str = "Guatemala",
    department_code: str = "GT-01",
    **kwargs,
) -> Municipality:
    muni = Municipality(code=code, name=name, department_code=department_code, **kwargs)
    db.add(muni)
    db.commit()
    db.refresh(muni)
    return muni


# ── Management endpoints (require admin/editor) ──────────────────────


class TestManagementListMunicipalities:
    def test_list_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/management/municipalities")
        assert resp.status_code == 401

    def test_list_returns_all(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code)
        _seed_municipality(db_session, "0102", "Santa Catarina Pinula", dept.code)

        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.get(
            "/api/v1/management/municipalities",
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_list_filter_by_department(self, client: TestClient, db_session: Session):
        d1 = _seed_department(db_session, "GT-01", "Guatemala")
        d2 = _seed_department(db_session, "GT-02", "El Progreso")
        _seed_municipality(db_session, "0101", "Guatemala", d1.code)
        _seed_municipality(db_session, "0201", "Guastatoya", d2.code)

        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.get(
            "/api/v1/management/municipalities?department_code=GT-02",
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["code"] == "0201"


class TestManagementGetMunicipality:
    def test_get_by_code(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code, population=1000000)

        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.get(
            "/api/v1/management/municipalities/0101",
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 200
        assert resp.json()["population"] == 1000000

    def test_get_not_found(self, client: TestClient, db_session: Session):
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.get(
            "/api/v1/management/municipalities/9999",
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 404


class TestManagementCreateMunicipality:
    def test_create_success(self, client: TestClient, db_session: Session):
        _seed_department(db_session)
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.post(
            "/api/v1/management/municipalities",
            json={
                "code": "0101",
                "name": "Guatemala",
                "department_code": "GT-01",
                "population": 1000000,
                "latitude": 14.6,
                "longitude": -90.5,
            },
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["code"] == "0101"
        assert data["population"] == 1000000
        assert data["is_active"] is True

    def test_create_duplicate_code(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code)
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.post(
            "/api/v1/management/municipalities",
            json={"code": "0101", "name": "Duplicado", "department_code": "GT-01"},
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 409

    def test_create_invalid_department(self, client: TestClient, db_session: Session):
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.post(
            "/api/v1/management/municipalities",
            json={"code": "0101", "name": "Guatemala", "department_code": "NOPE"},
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 422

    def test_create_forbidden_for_visor(self, client: TestClient, db_session: Session):
        user = create_user(db_session, "visor@test.com", "visor")
        resp = client.post(
            "/api/v1/management/municipalities",
            json={"code": "0101", "name": "Guatemala", "department_code": "GT-01"},
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 403


class TestManagementUpdateMunicipality:
    def test_update_success(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code)
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.patch(
            "/api/v1/management/municipalities/0101",
            json={"population": 2000000, "is_active": False},
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["population"] == 2000000
        assert data["is_active"] is False

    def test_update_not_found(self, client: TestClient, db_session: Session):
        user = create_user(db_session, "admin@test.com", "admin")
        resp = client.patch(
            "/api/v1/management/municipalities/9999",
            json={"name": "Nope"},
            headers={"Authorization": f"Bearer {auth_token(user)}"},
        )
        assert resp.status_code == 404


# ── Public endpoints (no auth) ───────────────────────────────────────


class TestPublicListMunicipalities:
    def test_list_only_active(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code, is_active=True)
        _seed_municipality(db_session, "0102", "Inactivo", dept.code, is_active=False)

        resp = client.get("/api/v1/public/municipalities")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["code"] == "0101"

    def test_list_filter_by_department(self, client: TestClient, db_session: Session):
        d1 = _seed_department(db_session, "GT-01", "Guatemala")
        d2 = _seed_department(db_session, "GT-02", "El Progreso")
        _seed_municipality(db_session, "0101", "Guatemala", d1.code)
        _seed_municipality(db_session, "0201", "Guastatoya", d2.code)

        resp = client.get("/api/v1/public/municipalities?department_code=GT-01")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["code"] == "0101"


class TestPublicGetMunicipality:
    def test_get_by_code(self, client: TestClient, db_session: Session):
        dept = _seed_department(db_session)
        _seed_municipality(db_session, "0101", "Guatemala", dept.code, latitude=14.6)

        resp = client.get("/api/v1/public/municipalities/0101")
        assert resp.status_code == 200
        assert resp.json()["latitude"] == 14.6

    def test_get_not_found(self, client: TestClient):
        resp = client.get("/api/v1/public/municipalities/9999")
        assert resp.status_code == 404
