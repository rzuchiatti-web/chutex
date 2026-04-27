"""Vérifie la migration en comparant les counts Mongo vs Postgres."""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from pymongo import MongoClient  # noqa: E402
from sqlalchemy import func, select  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from scripts.migrate_data import COLLECTION_TO_MODEL  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("verify")


def main() -> int:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ.get("MONGO_DB_NAME", "chutex_db")
    mclient = MongoClient(mongo_url)
    mdb = mclient[db_name]

    log.info(f"{'Collection':<40} {'Mongo':>10} {'Postgres':>10} {'Δ':>8}")
    log.info("-" * 72)
    total_mongo = total_pg = 0

    with SessionLocal() as session:
        for name, model_cls in sorted(COLLECTION_TO_MODEL.items()):
            mc = mdb[name].estimated_document_count()
            pgc = session.execute(select(func.count()).select_from(model_cls.__table__)).scalar() or 0
            delta = pgc - mc
            mark = "" if delta == 0 else (" ⚠" if delta < 0 else " ✓")
            log.info(f"{name:<40} {mc:>10} {pgc:>10} {delta:>+8}{mark}")
            total_mongo += mc
            total_pg += pgc

    log.info("-" * 72)
    log.info(f"{'TOTAL':<40} {total_mongo:>10} {total_pg:>10} {total_pg - total_mongo:>+8}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
