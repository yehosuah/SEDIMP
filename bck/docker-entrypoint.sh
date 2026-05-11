#!/bin/sh
set -eu

alembic upgrade head

if [ "${SEED_MUNICIPALITY_METRICS:-false}" = "true" ]; then
  python scripts/seed_municipality_metrics.py "${SEED_CSV_PATH:-/data/municipality_metrics_wide_2026-03-10_23-09-41.csv}"
fi

exec uvicorn main:app --host 0.0.0.0 --port 8000
