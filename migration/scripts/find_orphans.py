"""Détecte les références orphelines avant d'activer les foreign keys.

Pour chaque FK définie dans `0002_add_foreign_keys.py`, compte les lignes
où la valeur source n'a pas de correspondance dans la table cible. Affiche
un rapport pour que tu saches quoi nettoyer (ou si tu peux activer les FKs
en toute sécurité).

Usage :
    python scripts/find_orphans.py            # rapport complet
    python scripts/find_orphans.py --fix      # met à NULL les FK orphelines
                                              # quand la colonne est nullable
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from sqlalchemy import text  # noqa: E402

from app.database import sync_engine  # noqa: E402

# Charge la liste FOREIGN_KEYS depuis le fichier Alembic 0002 (nom non-importable)
import importlib.util  # noqa: E402
_fk_path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "0002_add_foreign_keys.py"
_spec = importlib.util.spec_from_file_location("_fk_module", _fk_path)
_fk_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_fk_module)
FOREIGN_KEYS = _fk_module.FOREIGN_KEYS

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("orphans")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true",
                        help="Met à NULL les références orphelines (colonnes nullables seulement)")
    args = parser.parse_args()

    log.info(f"{'Source':<50} {'Orphans':>10}")
    log.info("-" * 65)
    total = 0
    blocking = 0
    with sync_engine.connect() as conn:
        for name, src, src_col, dst, dst_col, _ondelete in FOREIGN_KEYS:
            sql = (
                f"SELECT COUNT(*) FROM {src} s "
                f"WHERE s.{src_col} IS NOT NULL "
                f"AND NOT EXISTS (SELECT 1 FROM {dst} d WHERE d.{dst_col} = s.{src_col})"
            )
            try:
                count = conn.execute(text(sql)).scalar() or 0
            except Exception as exc:
                log.warning(f"{src}.{src_col} → {dst}.{dst_col} : ERREUR ({exc})")
                continue

            if count == 0:
                continue
            label = f"{src}.{src_col} → {dst}.{dst_col}"
            log.info(f"{label:<50} {count:>10}")
            total += count

            if args.fix:
                # Vérifie si la colonne est nullable
                nullable = conn.execute(text(
                    "SELECT is_nullable FROM information_schema.columns "
                    "WHERE table_name = :t AND column_name = :c"
                ), {"t": src, "c": src_col}).scalar()
                if nullable == "YES":
                    fix_sql = (
                        f"UPDATE {src} SET {src_col} = NULL "
                        f"WHERE {src_col} IS NOT NULL "
                        f"AND NOT EXISTS (SELECT 1 FROM {dst} WHERE {dst_col} = {src}.{src_col})"
                    )
                    conn.execute(text(fix_sql))
                    conn.commit()
                    log.info(f"  → {count} lignes nettoyées (NULL)")
                else:
                    log.info(f"  → colonne NOT NULL, supprime ces lignes manuellement")
                    blocking += count

    log.info("-" * 65)
    log.info(f"Total références orphelines : {total}")
    if args.fix and blocking:
        log.warning(f"⚠ {blocking} références dans des colonnes NOT NULL : à nettoyer manuellement.")
    if total == 0:
        log.info("✅ Aucune orpheline. Tu peux lancer `alembic upgrade head` en toute sécurité.")
    elif not args.fix:
        log.info("Lance avec --fix pour mettre à NULL les colonnes nullables, "
                 "puis nettoie les NOT NULL manuellement.")
    return 0 if total == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
