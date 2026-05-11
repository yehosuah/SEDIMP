"""expand metric type code lengths

Revision ID: 0004_expand_metric_codes
Revises: 0003_muni_metrics_seed
Create Date: 2026-05-10 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_expand_metric_codes"
down_revision: str | None = "0003_muni_metrics_seed"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("metric_types", "code", existing_type=sa.String(length=80), type_=sa.String(length=200))
    op.alter_column("metric_types", "name", existing_type=sa.String(length=160), type_=sa.String(length=240))
    op.alter_column(
        "municipality_metric_values",
        "metric_type_code",
        existing_type=sa.String(length=80),
        type_=sa.String(length=200),
    )


def downgrade() -> None:
    op.alter_column(
        "municipality_metric_values",
        "metric_type_code",
        existing_type=sa.String(length=200),
        type_=sa.String(length=80),
    )
    op.alter_column("metric_types", "name", existing_type=sa.String(length=240), type_=sa.String(length=160))
    op.alter_column("metric_types", "code", existing_type=sa.String(length=200), type_=sa.String(length=80))
