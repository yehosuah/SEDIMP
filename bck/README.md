# sistemaEpidemiologico Backend

FastAPI backend scaffold for manager auth and public screen availability management.

## Stack

- Python 3.11-3.13
- FastAPI REST API
- PostgreSQL
- SQLAlchemy 2
- Alembic migrations
- JWT bearer auth plus secure HTTP-only cookies

## Local Run

Create `.env` from `.env.example` and make sure PostgreSQL is running locally with the
database URL configured in that file.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

This repo currently targets Python 3.11 through 3.13. If `python3 --version`
prints Python 3.14, use a Python 3.12 or 3.13 interpreter when creating `.venv`.

API:

- `GET /health`
- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/public/screens`
- `GET /api/v1/public/departments`
- `GET /api/v1/public/metric-types`
- `GET /api/v1/public/map/departments`
- `GET /api/v1/management/screens`
- `POST /api/v1/management/screens`
- `PATCH /api/v1/management/screens/{key}`
- `GET /api/v1/management/departments`
- `POST /api/v1/management/departments`
- `PATCH /api/v1/management/departments/{code}`
- `GET /api/v1/management/metric-type-categories`
- `POST /api/v1/management/metric-type-categories`
- `PATCH /api/v1/management/metric-type-categories/{category_id}`
- `DELETE /api/v1/management/metric-type-categories/{category_id}`
- `GET /api/v1/management/metric-types`
- `POST /api/v1/management/metric-types`
- `PATCH /api/v1/management/metric-types/{code}`
- `GET /api/v1/management/imports/municipality-data/template`
- `POST /api/v1/management/imports/municipality-data/analyze`
- `POST /api/v1/management/imports/municipality-data/preview`
- `POST /api/v1/management/imports/municipality-data`

## Access Model

Roles are intentionally not part of this backend.

Public visitors do not need accounts. Manager accounts are the only authenticated users in v1, and every manager can access all protected management activities.

Public screen availability is stored in the database. The public API returns only enabled screens; managers can create and toggle all screen records.

The IMProgress management API also stores departments, metric type categories,
metric types, and imported municipality metric values. Manager routes mutate that
data, while public routes expose active departments, active metrics, and map
markers for the current public views.

## Manager Bootstrap

Set these variables and run the service or script:

```bash
AUTO_CREATE_MANAGER=true
MANAGER_EMAIL=manager@example.com
MANAGER_PASSWORD=ChangeMe123!
```

Manual bootstrap:

```bash
python scripts/create_manager.py
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```
