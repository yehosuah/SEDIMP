# SEDIMP

Local full-stack runtime for the IMProgress backend, frontend, and PostgreSQL database.

## Docker Run

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:5173/
```

Services:

- `bd`: PostgreSQL 16, exposed on `localhost:55432` by default.
- `bck`: FastAPI backend, exposed on `localhost:8000`.
- `frt`: built Vite frontend, exposed on `localhost:5173`.

The backend container runs Alembic migrations at startup. By default it also imports
`bd/municipality_metrics_wide_2026-03-10_23-09-41.csv` through the same seeder script used locally.
Set `SEED_MUNICIPALITY_METRICS=false` in `.env` to skip that startup seed.

## Local Seeder

```bash
cd bck
alembic upgrade head
python scripts/seed_municipality_metrics.py ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv --dry-run
python scripts/seed_municipality_metrics.py ../bd/municipality_metrics_wide_2026-03-10_23-09-41.csv
```
