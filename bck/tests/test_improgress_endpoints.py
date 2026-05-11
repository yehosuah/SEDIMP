from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import User


def create_manager(db: Session) -> str:
    manager = User(
        email="improgress-manager@example.com",
        password_hash=hash_password("Password123!"),
        is_manager=True,
        is_active=True,
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    return create_access_token(manager.id, manager.is_manager)


def test_department_management_crud_and_public_map_data(
    client: TestClient,
    db_session: Session,
) -> None:
    headers = {"Authorization": f"Bearer {create_manager(db_session)}"}

    created = client.post(
        "/api/v1/management/departments",
        headers=headers,
        json={
            "code": "01",
            "name": "Guatemala",
            "capital": "Ciudad de Guatemala",
            "latitude": 14.6349,
            "longitude": -90.5069,
            "population": 3500000,
        },
    )
    assert created.status_code == 201
    assert created.json()["name"] == "Guatemala"

    updated = client.patch(
        "/api/v1/management/departments/01",
        headers=headers,
        json={"population": 3600000},
    )
    assert updated.status_code == 200
    assert updated.json()["population"] == 3600000

    departments = client.get("/api/v1/management/departments", headers=headers)
    assert departments.status_code == 200
    assert [department["code"] for department in departments.json()] == ["01"]

    public_map = client.get("/api/v1/public/map/departments")
    assert public_map.status_code == 200
    marker = public_map.json()["departments"][0]
    assert marker["code"] == "01"
    assert marker["metric_value"] == 3600000


def test_metric_categories_and_metric_types_support_current_filters(
    client: TestClient,
    db_session: Session,
) -> None:
    headers = {"Authorization": f"Bearer {create_manager(db_session)}"}

    category = client.post(
        "/api/v1/management/metric-type-categories",
        headers=headers,
        json={"name": "Demografía"},
    )
    assert category.status_code == 201
    category_id = category.json()["id"]

    metric_type = client.post(
        "/api/v1/management/metric-types",
        headers=headers,
        json={
            "code": "POB_TOTAL",
            "name": "Población Total",
            "category_id": category_id,
            "data_type": "integer",
            "unit": "personas",
        },
    )
    assert metric_type.status_code == 201
    assert metric_type.json()["category_name"] == "Demografía"

    metrics = client.get(
        "/api/v1/management/metric-types",
        headers=headers,
        params={"category_id": category_id, "search": "pob"},
    )
    assert metrics.status_code == 200
    assert [metric["code"] for metric in metrics.json()] == ["POB_TOTAL"]

    categories = client.get("/api/v1/management/metric-type-categories", headers=headers)
    assert categories.status_code == 200
    assert categories.json()[0]["metric_type_count"] == 1

    public_metrics = client.get("/api/v1/public/metric-types")
    assert public_metrics.status_code == 200
    assert public_metrics.json()[0]["code"] == "POB_TOTAL"


def test_import_flow_analyzes_previews_and_stores_metric_values(
    client: TestClient,
    db_session: Session,
) -> None:
    headers = {"Authorization": f"Bearer {create_manager(db_session)}"}

    department = client.post(
        "/api/v1/management/departments",
        headers=headers,
        json={
            "code": "01",
            "name": "Guatemala",
            "capital": "Ciudad de Guatemala",
            "latitude": 14.6349,
            "longitude": -90.5069,
            "population": 3500000,
        },
    )
    assert department.status_code == 201

    category = client.post(
        "/api/v1/management/metric-type-categories",
        headers=headers,
        json={"name": "Demografía"},
    )
    metric_type = client.post(
        "/api/v1/management/metric-types",
        headers=headers,
        json={
            "code": "POB_TOTAL",
            "name": "Población Total",
            "category_id": category.json()["id"],
            "data_type": "integer",
        },
    )
    assert metric_type.status_code == 201

    records = [
        {"municipio": "Guatemala", "departamento": "01", "pob_total": 923392},
        {"municipio": "Mixco", "departamento": "01", "pob_total": 505000},
    ]
    analyze = client.post(
        "/api/v1/management/imports/municipality-data/analyze",
        headers=headers,
        json={"records": records},
    )
    assert analyze.status_code == 200
    assert analyze.json()["total_records"] == 2
    assert analyze.json()["fields"][2]["field"] == "pob_total"
    assert analyze.json()["fields"][2]["detected_type"] == "integer"

    payload = {
        "records": records,
        "municipality_field": "municipio",
        "department_field": "departamento",
        "mappings": {"pob_total": "POB_TOTAL"},
    }
    preview = client.post(
        "/api/v1/management/imports/municipality-data/preview",
        headers=headers,
        json=payload,
    )
    assert preview.status_code == 200
    assert preview.json()["mapped_fields"] == 1
    assert preview.json()["metric_values"] == 2

    imported = client.post(
        "/api/v1/management/imports/municipality-data",
        headers=headers,
        json=payload,
    )
    assert imported.status_code == 201
    assert imported.json()["metric_values"] == 2

    map_data = client.get("/api/v1/public/map/departments", params={"metric_code": "POB_TOTAL"})
    assert map_data.status_code == 200
    assert map_data.json()["departments"][0]["metric_value"] == 1428392


def test_management_domain_endpoints_require_manager(client: TestClient) -> None:
    response = client.get("/api/v1/management/departments")

    assert response.status_code == 401
