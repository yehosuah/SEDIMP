# Municipality Metrics Seeder Implementation Plan

## Goal

Populate PostgreSQL from:

```text
../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv
```

The CSV is a wide municipality metrics export. It has one row per municipality and many repeated metric column groups:

```text
metric_slug
metric_slug_unit
metric_slug_source
metric_slug_last_updated
```

The seed should normalize this file into relational tables instead of creating hundreds of metric columns on a single table.

## Current Backend Context

The backend already uses:

- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL through `DATABASE_URL`
- Local run command: `uvicorn main:app --reload`

The seeder should follow the same runtime path as the API:

- Read database config from `app.core.config.settings.database_url`.
- Use the existing SQLAlchemy session setup from `app.db.session`.
- Keep schema changes in Alembic migrations.
- Keep import logic in a script under `scripts/`.

## Proposed Tables

### `departments`

Stores Guatemala department records.

Columns:

- `id`: integer primary key from CSV `department_id`
- `code`: string, unique, from CSV `department_code`
- `name`: string, required, from CSV `department_name`
- `created_at`: timestamp
- `updated_at`: timestamp

Indexes:

- unique index on `code`
- index on `name`

### `municipalities`

Stores municipality records.

Columns:

- `id`: integer primary key from CSV `municipality_id`
- `code`: string, unique, from CSV `municipality_code`
- `name`: string, required, from CSV `municipality_name`
- `department_id`: foreign key to `departments.id`
- `created_at`: timestamp
- `updated_at`: timestamp

Indexes:

- unique index on `code`
- index on `department_id`
- index on `name`

### `metric_types`

Stores the metric catalog. One record per metric slug detected in the CSV.

Columns:

- `id`: integer primary key
- `slug`: string, unique, required
- `label`: string, required
- `created_at`: timestamp
- `updated_at`: timestamp

Seeder behavior:

- `slug` comes from the CSV column name, for example `pct_pobreza_fgt0`.
- `label` can initially be generated from the slug, for example `Pct Pobreza Fgt0`.
- Later, labels can be edited through admin tooling without changing the source data.

Indexes:

- unique index on `slug`

### `municipality_metric_values`

Stores each metric value for a municipality.

Columns:

- `id`: integer primary key
- `municipality_id`: foreign key to `municipalities.id`
- `metric_type_id`: foreign key to `metric_types.id`
- `raw_value`: text, nullable
- `numeric_value`: numeric, nullable
- `unit`: string, nullable
- `source`: string, nullable
- `last_updated`: date, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

Constraints:

- unique constraint on `(municipality_id, metric_type_id)`

Indexes:

- index on `municipality_id`
- index on `metric_type_id`
- index on `numeric_value`
- index on `last_updated`

Seeder behavior:

- Keep the original cell in `raw_value`.
- Store a parsed decimal in `numeric_value` when the value is numeric.
- Leave `numeric_value` as `NULL` for empty values or text values such as hospital names.
- Preserve `unit`, `source`, and `last_updated` from the matching companion columns.

## SQLAlchemy Model Files

Add these model files:

```text
app/models/department.py
app/models/municipality.py
app/models/metric_type.py
app/models/municipality_metric_value.py
```

Update:

```text
app/models/__init__.py
```

The models should use the same declarative base as the existing auth and public screen models.

## Alembic Migration

Create a migration similar to:

```bash
cd bck
alembic revision -m "add municipality metric seed tables"
```

The migration should create the four tables in this order:

1. `departments`
2. `municipalities`
3. `metric_types`
4. `municipality_metric_values`

Rollback should drop them in reverse order.

## Seeder Script

Add:

```text
scripts/seed_municipality_metrics.py
```

Expected command:

```bash
cd bck
python scripts/seed_municipality_metrics.py ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv
```

Optional arguments:

```bash
python scripts/seed_municipality_metrics.py \
  ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv \
  --dry-run

python scripts/seed_municipality_metrics.py \
  ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv \
  --replace
```

Recommended modes:

- Default mode: upsert departments, municipalities, metric types, and metric values.
- `--dry-run`: parse the CSV and report counts without writing.
- `--replace`: delete existing municipality metric values before importing the file again.

## Metric Detection Rules

Identity columns:

```python
IDENTITY_COLUMNS = {
    "municipality_id",
    "municipality_name",
    "municipality_code",
    "department_id",
    "department_name",
    "department_code",
}
```

Metadata suffixes:

```python
METADATA_SUFFIXES = ("_unit", "_source", "_last_updated")
```

Metric columns are columns that:

- are not identity columns
- do not end with a metadata suffix

For each metric column, read:

```python
value = row[metric_slug]
unit = row.get(f"{metric_slug}_unit")
source = row.get(f"{metric_slug}_source")
last_updated = row.get(f"{metric_slug}_last_updated")
```

## Parsing Rules

### Empty values

Treat these as `NULL`:

```text
""
" "
```

### Numeric values

Parse values into `Decimal` when possible.

Examples:

```text
55.9580
0.0711
2594713
```

Store:

- original string in `raw_value`
- parsed decimal in `numeric_value`

### Text values

Some metric values are textual, for example hospital names or categories.

Store:

- original string in `raw_value`
- `NULL` in `numeric_value`

### Dates

Parse `_last_updated` as ISO dates:

```text
YYYY-MM-DD
```

Invalid or empty dates should become `NULL`, and the script should count them in the import summary.

## Upsert Strategy

The seeder should be idempotent.

Recommended behavior:

- Department: upsert by `id`.
- Municipality: upsert by `id`.
- Metric type: upsert by `slug`.
- Municipality metric value: upsert by `(municipality_id, metric_type_id)`.

For PostgreSQL, use SQLAlchemy with PostgreSQL `ON CONFLICT DO UPDATE` where practical.

For local development and tests, a simpler session merge/upsert helper is acceptable if it remains deterministic.

## Expected Import Summary

At the end, print a compact summary:

```text
CSV rows read: 340
metric types detected: 209
departments upserted: <count>
municipalities upserted: <count>
metric values upserted: <count>
empty metric values skipped or stored: <count>
invalid dates: <count>
non-numeric values stored as raw text: <count>
```

Decision to make during implementation:

- Either store empty metric values as rows with `raw_value = NULL`.
- Or skip empty metric values completely.

Recommended default: skip empty metric values to keep the values table smaller.

## Backend API Follow-Up

Once the seed exists, add read endpoints for the frontend.

Recommended public endpoints:

```text
GET /api/v1/public/departments
GET /api/v1/public/municipalities
GET /api/v1/public/metrics
GET /api/v1/public/municipalities/{municipality_id}/metrics
GET /api/v1/public/metrics/{metric_slug}/municipalities
```

Recommended management endpoints:

```text
POST /api/v1/management/imports/municipality-metrics
GET /api/v1/management/imports/municipality-metrics/status
```

The first implementation can stay script-only. API-triggered imports can come later after the data model is stable.

## Tests

Add tests for:

- metric column detection
- numeric parsing
- date parsing
- idempotent re-import
- preserving text-only metric values
- skipping or storing empty values according to the final decision

Suggested test file:

```text
tests/test_municipality_metrics_seed.py
```

Use a tiny CSV fixture with:

- two municipalities
- two numeric metrics
- one text metric
- one empty metric value
- one invalid date

## Local Run Sequence

```bash
cd bck
source .venv/bin/activate
alembic upgrade head
python scripts/seed_municipality_metrics.py ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv --dry-run
python scripts/seed_municipality_metrics.py ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv
pytest
```

## Future Docker Containerization

The seeder should be designed so it can run in Docker without changing code.

Requirements:

- Database connection must come from `DATABASE_URL`.
- CSV path must be passed as a CLI argument.
- The script must not assume the host path `/Users/...`.
- The script should exit non-zero on failed imports.
- The script should print a clear summary to container logs.

### Future Compose Layout

Possible future services:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sistema_epidemiologico
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./bck
    environment:
      DATABASE_URL: postgresql+psycopg://app:app@db:5432/sistema_epidemiologico
    depends_on:
      - db
    ports:
      - "8000:8000"

  seed:
    build: ./bck
    environment:
      DATABASE_URL: postgresql+psycopg://app:app@db:5432/sistema_epidemiologico
    volumes:
      - ./bd:/data:ro
    command:
      - sh
      - -c
      - |
        alembic upgrade head &&
        python scripts/seed_municipality_metrics.py /data/municipality_metrics_wide_2026-03-10_23-09-41.csv
    depends_on:
      - db
```

Notes:

- `seed` should be a one-shot service, not a long-running service.
- The CSV should be mounted read-only.
- In CI or deployment, run migrations before the seed command.
- If the seed becomes large, use a staging table plus PostgreSQL `COPY` for performance.

### Future Dockerfile Considerations

The backend image should include:

- Python dependencies from `requirements.txt`
- Alembic files
- `app/`
- `scripts/`
- root `main.py`

The CSV should not be baked into the API image unless the deployment intentionally ships seed data with the app.

## Implementation Order

1. Add SQLAlchemy models.
2. Add Alembic migration.
3. Add parser and import helpers.
4. Add `scripts/seed_municipality_metrics.py`.
5. Add unit tests with a small CSV fixture.
6. Run migration locally.
7. Run dry-run import.
8. Run real import.
9. Verify row counts in PostgreSQL.
10. Add API endpoints only after the seed data model is verified.

## Acceptance Criteria

The seeder implementation is complete when:

- `alembic upgrade head` creates all seed tables.
- The dry run reports the expected number of rows and metric types.
- The real import completes without crashing.
- Re-running the import does not duplicate data.
- Tests pass.
- The same command can run locally or inside a future Docker container by changing only `DATABASE_URL` and the CSV path.
