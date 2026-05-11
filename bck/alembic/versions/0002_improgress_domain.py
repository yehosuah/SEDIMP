"""add improgress domain endpoints schema

Revision ID: 0002_improgress_domain
Revises: 0001_initial_auth
Create Date: 2026-05-09 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_improgress_domain"
down_revision: str | None = "0001_initial_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("code", sa.String(length=8), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("capital", sa.String(length=160), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("population", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_departments_name", "departments", ["name"], unique=True)
    op.create_index("ix_departments_is_active", "departments", ["is_active"])

    op.create_table(
        "metric_type_categories",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_metric_type_categories_name", "metric_type_categories", ["name"], unique=True)
    op.create_index("ix_metric_type_categories_is_active", "metric_type_categories", ["is_active"])

    op.create_table(
        "metric_types",
        sa.Column("code", sa.String(length=80), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=False),
        sa.Column("data_type", sa.String(length=40), nullable=False),
        sa.Column("unit", sa.String(length=80), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["category_id"], ["metric_type_categories.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_metric_types_name", "metric_types", ["name"])
    op.create_index("ix_metric_types_category_id", "metric_types", ["category_id"])
    op.create_index("ix_metric_types_is_active", "metric_types", ["is_active"])

    op.create_table(
        "municipality_metric_values",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("department_code", sa.String(length=8), nullable=False),
        sa.Column("municipality_name", sa.String(length=160), nullable=False),
        sa.Column("metric_type_code", sa.String(length=80), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["department_code"], ["departments.code"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["metric_type_code"], ["metric_types.code"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "department_code",
            "municipality_name",
            "metric_type_code",
            name="uq_municipality_metric_values_identity",
        ),
    )
    op.create_index("ix_municipality_metric_values_department_code", "municipality_metric_values", ["department_code"])
    op.create_index("ix_municipality_metric_values_municipality_name", "municipality_metric_values", ["municipality_name"])
    op.create_index("ix_municipality_metric_values_metric_type_code", "municipality_metric_values", ["metric_type_code"])


def downgrade() -> None:
    op.drop_index("ix_municipality_metric_values_metric_type_code", table_name="municipality_metric_values")
    op.drop_index("ix_municipality_metric_values_municipality_name", table_name="municipality_metric_values")
    op.drop_index("ix_municipality_metric_values_department_code", table_name="municipality_metric_values")
    op.drop_table("municipality_metric_values")
    op.drop_index("ix_metric_types_is_active", table_name="metric_types")
    op.drop_index("ix_metric_types_category_id", table_name="metric_types")
    op.drop_index("ix_metric_types_name", table_name="metric_types")
    op.drop_table("metric_types")
    op.drop_index("ix_metric_type_categories_is_active", table_name="metric_type_categories")
    op.drop_index("ix_metric_type_categories_name", table_name="metric_type_categories")
    op.drop_table("metric_type_categories")
    op.drop_index("ix_departments_is_active", table_name="departments")
    op.drop_index("ix_departments_name", table_name="departments")
    op.drop_table("departments")
