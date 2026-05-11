"""add municipality metrics seed metadata

Revision ID: 0003_muni_metrics_seed
Revises: 0002_improgress_domain
Create Date: 2026-05-10 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_muni_metrics_seed"
down_revision: str | None = "0002_improgress_domain"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "municipalities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("department_code", sa.String(length=8), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["department_code"], ["departments.code"], ondelete="CASCADE"),
    )
    op.create_index("ix_municipalities_code", "municipalities", ["code"], unique=True)
    op.create_index("ix_municipalities_department_code", "municipalities", ["department_code"])
    op.create_index("ix_municipalities_name", "municipalities", ["name"])

    op.add_column("municipality_metric_values", sa.Column("municipality_id", sa.Integer(), nullable=True))
    op.add_column("municipality_metric_values", sa.Column("raw_value", sa.Text(), nullable=True))
    op.add_column("municipality_metric_values", sa.Column("numeric_value", sa.Numeric(), nullable=True))
    op.add_column("municipality_metric_values", sa.Column("unit", sa.String(length=80), nullable=True))
    op.add_column("municipality_metric_values", sa.Column("source", sa.String(length=255), nullable=True))
    op.add_column("municipality_metric_values", sa.Column("last_updated", sa.Date(), nullable=True))
    op.alter_column("municipality_metric_values", "value", existing_type=sa.Float(), nullable=True)
    op.create_foreign_key(
        "fk_municipality_metric_values_municipality_id",
        "municipality_metric_values",
        "municipalities",
        ["municipality_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_municipality_metric_values_municipality_id",
        "municipality_metric_values",
        ["municipality_id"],
    )
    op.create_index(
        "ix_municipality_metric_values_numeric_value",
        "municipality_metric_values",
        ["numeric_value"],
    )
    op.create_index(
        "ix_municipality_metric_values_last_updated",
        "municipality_metric_values",
        ["last_updated"],
    )
    op.create_unique_constraint(
        "uq_municipality_metric_values_municipality_metric",
        "municipality_metric_values",
        ["municipality_id", "metric_type_code"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_municipality_metric_values_municipality_metric",
        "municipality_metric_values",
        type_="unique",
    )
    op.drop_index("ix_municipality_metric_values_last_updated", table_name="municipality_metric_values")
    op.drop_index("ix_municipality_metric_values_numeric_value", table_name="municipality_metric_values")
    op.drop_index("ix_municipality_metric_values_municipality_id", table_name="municipality_metric_values")
    op.drop_constraint(
        "fk_municipality_metric_values_municipality_id",
        "municipality_metric_values",
        type_="foreignkey",
    )
    op.alter_column("municipality_metric_values", "value", existing_type=sa.Float(), nullable=False)
    op.drop_column("municipality_metric_values", "last_updated")
    op.drop_column("municipality_metric_values", "source")
    op.drop_column("municipality_metric_values", "unit")
    op.drop_column("municipality_metric_values", "numeric_value")
    op.drop_column("municipality_metric_values", "raw_value")
    op.drop_column("municipality_metric_values", "municipality_id")

    op.drop_index("ix_municipalities_name", table_name="municipalities")
    op.drop_index("ix_municipalities_department_code", table_name="municipalities")
    op.drop_index("ix_municipalities_code", table_name="municipalities")
    op.drop_table("municipalities")
