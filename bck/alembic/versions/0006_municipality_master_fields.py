"""add territorial fields to municipalities table

Revision ID: 0006_municipality_master_fields
Revises: 0005_rbac_users_roles_audit
Create Date: 2026-06-19 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_municipality_master_fields"
down_revision: str | None = "0005_rbac_users_roles_audit"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("municipalities", sa.Column("population", sa.Integer(), nullable=True))
    op.add_column("municipalities", sa.Column("area_km2", sa.Float(), nullable=True))
    op.add_column("municipalities", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("municipalities", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("municipalities", sa.Column("altitude", sa.Float(), nullable=True))
    op.add_column(
        "municipalities",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_municipalities_is_active", "municipalities", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_municipalities_is_active", table_name="municipalities")
    op.drop_column("municipalities", "is_active")
    op.drop_column("municipalities", "altitude")
    op.drop_column("municipalities", "longitude")
    op.drop_column("municipalities", "latitude")
    op.drop_column("municipalities", "area_km2")
    op.drop_column("municipalities", "population")
