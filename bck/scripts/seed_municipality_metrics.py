from __future__ import annotations

import argparse
import csv
import sys
import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal  # noqa: E402
from app.models.department import Department  # noqa: E402
from app.models.metric_type import MetricType  # noqa: E402
from app.models.metric_type_category import MetricTypeCategory  # noqa: E402
from app.models.municipality import Municipality  # noqa: E402
from app.models.municipality_metric_value import MunicipalityMetricValue  # noqa: E402

IDENTITY_COLUMNS = {
    "municipality_id",
    "municipality_name",
    "municipality_code",
    "department_id",
    "department_name",
    "department_code",
}
METADATA_SUFFIXES = ("_unit", "_source", "_last_updated")
SEEDED_CATEGORY_ID = "municipality-metrics"
SEEDED_CATEGORY_NAME = "Municipality Metrics"


@dataclass(slots=True)
class ImportSummary:
    csv_rows_read: int = 0
    metric_types_detected: int = 0
    departments_upserted: int = 0
    municipalities_upserted: int = 0
    metric_values_upserted: int = 0
    empty_metric_values_skipped: int = 0
    invalid_dates: int = 0
    non_numeric_values_stored_as_raw_text: int = 0

    def print(self) -> None:
        print(f"CSV rows read: {self.csv_rows_read}")
        print(f"metric types detected: {self.metric_types_detected}")
        print(f"departments upserted: {self.departments_upserted}")
        print(f"municipalities upserted: {self.municipalities_upserted}")
        print(f"metric values upserted: {self.metric_values_upserted}")
        print(f"empty metric values skipped: {self.empty_metric_values_skipped}")
        print(f"invalid dates: {self.invalid_dates}")
        print(f"non-numeric values stored as raw text: {self.non_numeric_values_stored_as_raw_text}")


def detect_metric_columns(fieldnames: list[str]) -> list[str]:
    return [
        field
        for field in fieldnames
        if field not in IDENTITY_COLUMNS and not field.endswith(METADATA_SUFFIXES)
    ]


def parse_decimal(value: str | None) -> Decimal | None:
    normalized = _clean(value)
    if normalized is None:
        return None
    try:
        return Decimal(normalized)
    except InvalidOperation:
        return None


def parse_iso_date(value: str | None) -> tuple[date | None, bool]:
    normalized = _clean(value)
    if normalized is None:
        return None, False
    try:
        return date.fromisoformat(normalized), False
    except ValueError:
        return None, True


def label_from_slug(slug: str) -> str:
    return slug.replace("_", " ").title()


def infer_data_type(raw_value: str | None, numeric_value: Decimal | None) -> str:
    if numeric_value is None:
        return "string"
    if raw_value and raw_value.strip().isdigit():
        return "integer"
    return "percentage" if Decimal("0") <= numeric_value <= Decimal("1") else "decimal"


def seed_municipality_metrics(db: Session, csv_path: Path, *, dry_run: bool = False, replace: bool = False) -> ImportSummary:
    rows, metric_columns = read_csv(csv_path)
    summary = ImportSummary(csv_rows_read=len(rows), metric_types_detected=len(metric_columns))

    if dry_run:
        for row in rows:
            for metric_slug in metric_columns:
                raw_value = _clean(row.get(metric_slug))
                if raw_value is None:
                    summary.empty_metric_values_skipped += 1
                    continue
                numeric_value = parse_decimal(raw_value)
                if numeric_value is None:
                    summary.non_numeric_values_stored_as_raw_text += 1
                _, invalid = parse_iso_date(row.get(f"{metric_slug}_last_updated"))
                if invalid:
                    summary.invalid_dates += 1
                summary.metric_values_upserted += 1
        summary.departments_upserted = len({row["department_code"] for row in rows})
        summary.municipalities_upserted = len({int(row["municipality_id"]) for row in rows})
        return summary

    if replace:
        db.execute(delete(MunicipalityMetricValue))

    category = _ensure_seed_category(db)
    department_cache: dict[str, Department] = {}
    municipality_cache: dict[int, Municipality] = {}
    metric_type_cache = _upsert_metric_types(db, rows, metric_columns, category)
    department_codes_seen: set[str] = set()
    municipality_ids_seen: set[int] = set()

    for row in rows:
        department_code = _required(row, "department_code")
        department = _upsert_department(db, row, department_cache)
        if department_code not in department_codes_seen:
            summary.departments_upserted += 1
            department_codes_seen.add(department_code)

        municipality = _upsert_municipality(db, row, municipality_cache)
        if municipality.id not in municipality_ids_seen:
            summary.municipalities_upserted += 1
            municipality_ids_seen.add(municipality.id)

        for metric_slug in metric_columns:
            raw_value = _clean(row.get(metric_slug))
            if raw_value is None:
                summary.empty_metric_values_skipped += 1
                continue

            numeric_value = parse_decimal(raw_value)
            if numeric_value is None:
                summary.non_numeric_values_stored_as_raw_text += 1
            last_updated, invalid_date = parse_iso_date(row.get(f"{metric_slug}_last_updated"))
            if invalid_date:
                summary.invalid_dates += 1

            metric_type = metric_type_cache.get(metric_slug)
            if metric_type is None:
                raise RuntimeError(f"Metric type was not initialized: {metric_slug}")

            _upsert_metric_value(
                db,
                department=department,
                municipality=municipality,
                metric_type=metric_type,
                raw_value=raw_value,
                numeric_value=numeric_value,
                unit=_clean(row.get(f"{metric_slug}_unit")),
                source=_clean(row.get(f"{metric_slug}_source")),
                last_updated=last_updated,
            )
            summary.metric_values_upserted += 1

    db.commit()
    return summary


def read_csv(csv_path: Path) -> tuple[list[dict[str, str]], list[str]]:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        fieldnames = reader.fieldnames or []
        missing = IDENTITY_COLUMNS - set(fieldnames)
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
        rows = list(reader)
    return rows, detect_metric_columns(fieldnames)


def _ensure_seed_category(db: Session) -> MetricTypeCategory:
    category = db.get(MetricTypeCategory, SEEDED_CATEGORY_ID)
    if category is not None:
        return category
    category = MetricTypeCategory(id=SEEDED_CATEGORY_ID, name=SEEDED_CATEGORY_NAME, is_active=True)
    db.add(category)
    db.flush()
    return category


def _upsert_metric_types(
    db: Session,
    rows: list[dict[str, str]],
    metric_columns: list[str],
    category: MetricTypeCategory,
) -> dict[str, MetricType]:
    metric_types: dict[str, MetricType] = {}
    for metric_slug in metric_columns:
        unit = None
        data_type = "string"
        for row in rows:
            raw_value = _clean(row.get(metric_slug))
            unit = unit or _clean(row.get(f"{metric_slug}_unit"))
            if raw_value is not None:
                data_type = infer_data_type(raw_value, parse_decimal(raw_value))
                break
        metric_types[metric_slug] = _upsert_metric_type(
            db,
            metric_slug,
            unit=unit,
            data_type=data_type,
            category=category,
        )
    return metric_types


def _upsert_department(
    db: Session,
    row: dict[str, str],
    cache: dict[str, Department],
) -> Department:
    code = _required(row, "department_code")
    department = cache.get(code)
    if department is None:
        department = db.get(Department, code)
    if department is None:
        department = Department(code=code, name=_required(row, "department_name"), is_active=True)
        db.add(department)
    department.name = _required(row, "department_name")
    cache[code] = department
    return department


def _upsert_municipality(
    db: Session,
    row: dict[str, str],
    cache: dict[int, Municipality],
) -> Municipality:
    municipality_id = int(_required(row, "municipality_id"))
    municipality = cache.get(municipality_id)
    if municipality is None:
        municipality = db.get(Municipality, municipality_id)
    if municipality is None:
        municipality = Municipality(id=municipality_id)
        db.add(municipality)
    municipality.code = _required(row, "municipality_code")
    municipality.name = _required(row, "municipality_name")
    municipality.department_code = _required(row, "department_code")
    cache[municipality_id] = municipality
    return municipality


def _upsert_metric_type(
    db: Session,
    slug: str,
    *,
    unit: str | None,
    data_type: str,
    category: MetricTypeCategory,
) -> MetricType:
    metric_type = db.get(MetricType, slug)
    if metric_type is None:
        metric_type = MetricType(code=slug, name=label_from_slug(slug), category_id=category.id, data_type=data_type)
        db.add(metric_type)
    metric_type.unit = unit or metric_type.unit
    metric_type.category_id = category.id
    metric_type.data_type = data_type if metric_type.data_type == "string" else metric_type.data_type
    metric_type.is_active = True
    return metric_type


def _upsert_metric_value(
    db: Session,
    *,
    department: Department,
    municipality: Municipality,
    metric_type: MetricType,
    raw_value: str,
    numeric_value: Decimal | None,
    unit: str | None,
    source: str | None,
    last_updated: date | None,
) -> MunicipalityMetricValue:
    existing = db.scalar(
        select(MunicipalityMetricValue).where(
            MunicipalityMetricValue.municipality_id == municipality.id,
            MunicipalityMetricValue.metric_type_code == metric_type.code,
        )
    )
    if existing is None:
        existing = MunicipalityMetricValue(
            id=str(uuid.uuid4()),
            municipality_id=municipality.id,
            department_code=department.code,
            municipality_name=municipality.name,
            metric_type_code=metric_type.code,
        )
        db.add(existing)

    existing.department_code = department.code
    existing.municipality_name = municipality.name
    existing.raw_value = raw_value
    existing.numeric_value = numeric_value
    existing.value = float(numeric_value) if numeric_value is not None else None
    existing.unit = unit
    existing.source = source
    existing.last_updated = last_updated
    return existing


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _required(row: dict[str, str], key: str) -> str:
    value = _clean(row.get(key))
    if value is None:
        raise ValueError(f"CSV row is missing required value: {key}")
    return value


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed normalized municipality metrics from a wide CSV export.")
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="Parse the CSV and print counts without writing.")
    parser.add_argument("--replace", action="store_true", help="Delete existing metric values before importing.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    db = SessionLocal()
    try:
        summary = seed_municipality_metrics(db, args.csv_path, dry_run=args.dry_run, replace=args.replace)
        summary.print()
    except Exception as exc:
        db.rollback()
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
