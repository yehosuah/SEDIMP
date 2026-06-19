"""role-based access control, user lockout fields and audit log

Revision ID: 0005_rbac_users_roles_audit
Revises: 0004_expand_metric_codes
Create Date: 2026-06-19 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_rbac_users_roles_audit"
down_revision: str | None = "0004_expand_metric_codes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


DEFAULT_ROLES = [
    {"name": "admin", "description": "Control total del sistema y administración de usuarios."},
    {"name": "editor", "description": "Carga datos, crea, edita y publica indicadores."},
    {"name": "visor", "description": "Acceso autenticado de solo lectura para análisis."},
]


def upgrade() -> None:
    roles = op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_roles_name", "roles", ["name"], unique=True)
    op.bulk_insert(roles, DEFAULT_ROLES)

    # users: add RBAC + lockout columns, backfill existing accounts as admin.
    op.add_column("users", sa.Column("role_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin')")

    op.alter_column("users", "role_id", existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key("fk_users_role_id_roles", "users", "roles", ["role_id"], ["id"])
    op.create_index("ix_users_role_id", "users", ["role_id"])

    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.alter_column("users", "is_active", existing_type=sa.Boolean(), server_default=sa.false())

    op.drop_index("ix_users_is_manager", table_name="users")
    op.drop_column("users", "is_manager")

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=True),
        sa.Column("entity_id", sa.String(length=80), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.add_column("users", sa.Column("is_manager", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_users_is_manager", "users", ["is_manager"])
    op.execute("UPDATE users SET is_manager = true WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')")

    op.alter_column("users", "is_active", existing_type=sa.Boolean(), server_default=sa.true())
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)

    op.drop_index("ix_users_role_id", table_name="users")
    op.drop_constraint("fk_users_role_id_roles", "users", type_="foreignkey")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "role_id")

    op.drop_index("ix_roles_name", table_name="roles")
    op.drop_table("roles")
