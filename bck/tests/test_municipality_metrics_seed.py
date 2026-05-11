from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.metric_type import MetricType
from app.models.municipality import Municipality
from app.models.municipality_metric_value import MunicipalityMetricValue
from scripts.seed_municipality_metrics import (
    detect_metric_columns,
    parse_decimal,
    parse_iso_date,
    seed_municipality_metrics,
)


def write_fixture_csv(tmp_path: Path) -> Path:
    csv_path = tmp_path / "municipality_metrics.csv"
    csv_path.write_text(
        "\n".join(
            [
                "municipality_id,municipality_name,municipality_code,department_id,department_name,department_code,pct_pobreza,pct_pobreza_unit,pct_pobreza_source,pct_pobreza_last_updated,hospital,hospital_unit,hospital_source,hospital_last_updated,empty_metric,empty_metric_unit,empty_metric_source,empty_metric_last_updated",
                "1,Guatemala,101,1,Guatemala,1,0.45,%,Source A,2025-01-01,Hospital General,,Source B,not-a-date,,,,",
                "2,Mixco,102,1,Guatemala,1,0.33,%,Source A,2025-01-02,,,,,,,,",
            ]
        ),
        encoding="utf-8",
    )
    return csv_path


def test_detect_metric_columns_ignores_identity_and_metadata() -> None:
    assert detect_metric_columns(
        [
            "municipality_id",
            "municipality_name",
            "department_code",
            "pct_pobreza",
            "pct_pobreza_unit",
            "pct_pobreza_source",
            "pct_pobreza_last_updated",
            "hospital",
        ]
    ) == ["pct_pobreza", "hospital"]


def test_parse_decimal_and_iso_date() -> None:
    assert parse_decimal("55.9580") is not None
    assert parse_decimal("Hospital General") is None
    parsed_date, invalid = parse_iso_date("2025-01-01")
    assert parsed_date is not None
    assert invalid is False
    parsed_date, invalid = parse_iso_date("not-a-date")
    assert parsed_date is None
    assert invalid is True


def test_seed_municipality_metrics_is_idempotent_and_preserves_raw_text(
    tmp_path: Path,
    db_session: Session,
) -> None:
    csv_path = write_fixture_csv(tmp_path)

    summary = seed_municipality_metrics(db_session, csv_path)
    assert summary.csv_rows_read == 2
    assert summary.metric_types_detected == 3
    assert summary.departments_upserted == 1
    assert summary.municipalities_upserted == 2
    assert summary.metric_values_upserted == 3
    assert summary.empty_metric_values_skipped == 3
    assert summary.invalid_dates == 1
    assert summary.non_numeric_values_stored_as_raw_text == 1

    repeat_summary = seed_municipality_metrics(db_session, csv_path)
    assert repeat_summary.metric_values_upserted == 3

    assert db_session.scalar(select(func.count()).select_from(Department)) == 1
    assert db_session.scalar(select(func.count()).select_from(Municipality)) == 2
    assert db_session.scalar(select(func.count()).select_from(MetricType)) == 3
    assert db_session.scalar(select(func.count()).select_from(MunicipalityMetricValue)) == 3

    text_value = db_session.scalar(
        select(MunicipalityMetricValue).where(MunicipalityMetricValue.metric_type_code == "hospital")
    )
    assert text_value is not None
    assert text_value.raw_value == "Hospital General"
    assert text_value.numeric_value is None
    assert text_value.last_updated is None
