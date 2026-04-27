"""Initial schema (92 tables) — création complète de la base.

Cette première révision crée toutes les tables à partir des metadata SQLAlchemy.
Les révisions suivantes (`alembic revision --autogenerate ...`) compareront le
schéma de la base à `Base.metadata` pour générer des diffs incrémentaux.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-02-01

"""
from alembic import op

from app.database import Base
from app import models  # noqa: F401  (effet de bord : enregistre toutes les tables)

# revision identifiers
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
