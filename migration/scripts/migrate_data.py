"""Migration des données MongoDB → PostgreSQL.

Lecture des collections Mongo, mapping vers les modèles SQLAlchemy, et
INSERT idempotent (`ON CONFLICT DO NOTHING`).

Usage :

    cp .env.example .env  # éditer DATABASE_URL et MONGO_URL
    python scripts/migrate_data.py            # toutes les collections
    python scripts/migrate_data.py users      # seulement la collection users
    python scripts/migrate_data.py users alerts shop_orders
"""
from __future__ import annotations

import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Permet d'exécuter ce script depuis migration/scripts/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from pymongo import MongoClient  # noqa: E402
from sqlalchemy import inspect  # noqa: E402
from sqlalchemy.dialects.postgresql import insert as pg_insert  # noqa: E402

from app.database import SessionLocal, sync_engine  # noqa: E402
from app import models  # noqa: F401, E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("migrate_data")


# Mapping nom de collection Mongo → classe ORM SQLAlchemy
COLLECTION_TO_MODEL: dict[str, type] = {
    # auth
    "users": models.User,
    "verification_codes": models.VerificationCode,
    "live_activity_tokens": models.LiveActivityToken,
    # shop
    "shop_orders": models.ShopOrder,
    "contracts": models.Contract,
    "subscriptions": models.Subscription,
    "payment_transactions": models.PaymentTransaction,
    "payment_history": models.PaymentHistory,
    "internal_invoices": models.InternalInvoice,
    "stripe_config": models.StripeConfig,
    "prescriptions": models.Prescription,
    "sent_emails": models.SentEmail,
    # health
    "health_vitals": models.HealthVital,
    "latest_vitals": models.LatestVitals,
    "ecg_records": models.EcgRecord,
    "glycemia_history": models.GlycemiaHistory,
    "glycemia_calibrations": models.GlycemiaCalibration,
    "weighings": models.Weighing,
    "device_readings": models.DeviceReading,
    "scale_members": models.ScaleMember,
    "thresholds": models.Threshold,
    "dashboard_summary": models.DashboardSummary,
    "daily_report_cache": models.DailyReportCache,
    "health_summary_cache": models.HealthSummaryCache,
    "body_age_cache": models.BodyAgeCache,
    # alerts
    "alerts": models.Alert,
    "predictive_alerts": models.PredictiveAlert,
    "alert_live_status": models.AlertLiveStatus,
    "alert_tracking": models.AlertTracking,
    "escalations": models.Escalation,
    "teleassistance_calls": models.TeleassistanceCall,
    "twilio_calls": models.TwilioCall,
    "speech_responses": models.SpeechResponse,
    "audio_cache": models.AudioCache,
    "teleconsults": models.Teleconsult,
    "interventions": models.Intervention,
    "intervention_tracking": models.InterventionTracking,
    "incidents": models.Incident,
    "carewatch_incidents": models.CarewatchIncident,
    # devices
    "devices": models.Device,
    "bracelet_commands": models.BraceletCommand,
    "lefu_devices": models.LefuDevice,
    "dorsi_bilans": models.DorsiBilan,
    "dorsi_programs": models.DorsiProgram,
    "locations": models.Location,
    "geofences": models.Geofence,
    "firmware": models.Firmware,
    # guardian
    "guardians": models.Guardian,
    "guardian_beneficiaries": models.GuardianBeneficiary,
    "guardian_relationships": models.GuardianRelationship,
    "guardian_permissions": models.GuardianPermission,
    "guardian_requests": models.GuardianRequest,
    "guardian_invitations": models.GuardianInvitation,
    "guardian_links": models.GuardianLink,
    "link_codes": models.LinkCode,
    "agencies": models.Agency,
    "activation_codes": models.ActivationCode,
    "intervention_codes": models.InterventionCode,
    "saad_accounts": models.SaadAccount,
    "saad_guardian_links": models.SaadGuardianLink,
    "saad_stripe": models.SaadStripe,
    "saad_commissions": models.SaadCommission,
    "saad_invitations": models.SaadInvitation,
    # pro
    "pro_applications": models.ProApplication,
    "pro_subscriptions": models.ProSubscription,
    "pro_conversations": models.ProConversation,
    "pro_messages": models.ProMessage,
    "pro_notifications": models.ProNotification,
    "pro_exercise_templates": models.ProExerciseTemplate,
    "pro_assigned_exercises": models.ProAssignedExercise,
    "pro_meal_templates": models.ProMealTemplate,
    "pro_assigned_meals": models.ProAssignedMeal,
    "pro_meals": models.ProMeal,
    "pro_reminder_templates": models.ProReminderTemplate,
    "pro_assigned_reminders": models.ProAssignedReminder,
    "pro_programs": models.ProProgram,
    # programs
    "programs": models.Program,
    "program_enrollments": models.ProgramEnrollment,
    "program_checkins": models.ProgramCheckin,
    "program_task_progress": models.ProgramTaskProgress,
    "program_health_baselines": models.ProgramHealthBaseline,
    "team_programs": models.TeamProgram,
    "team_activity_feed": models.TeamActivityFeed,
    "team_invitations": models.TeamInvitation,
    "minceur_goals": models.MinceurGoal,
    "minceur_programs": models.MinceurProgram,
    "minceur_tracking": models.MinceurTracking,
    "minceur_daily_cache": models.MinceurDailyCache,
    # notifications
    "notifications": models.Notification,
    "push_tokens": models.PushToken,
    "push_subscriptions": models.PushSubscription,
    "push_preferences": models.PushPreference,
    "push_log": models.PushLog,
    "push_history": models.PushHistory,
    "reminders": models.Reminder,
    "reminder_vibrations": models.ReminderVibration,
    "sleep_alarms": models.SleepAlarm,
    "wake_vibrations": models.WakeVibration,
    "bedtime_notifications": models.BedtimeNotification,
    "sms_invitations": models.SmsInvitation,
    # misc
    "chat_messages": models.ChatMessage,
    "user_streaks": models.UserStreak,
    "activity_streaks": models.ActivityStreak,
    "rewards": models.Reward,
    "reward_winners": models.RewardWinner,
    "rewards_history": models.RewardHistory,
    "recommendations": models.Recommendation,
    "nora_analysis_cache": models.NoraAnalysisCache,
    "nora_page_analysis_cache": models.NoraPageAnalysisCache,
    "nora_health_analysis_cache": models.NoraHealthAnalysisCache,
    "nora_aging_analysis_cache": models.NoraAgingAnalysisCache,
    "personalized_tasks_cache": models.PersonalizedTasksCache,
    "rgpd_requests": models.RgpdRequest,
    "user_consents": models.UserConsent,
    "settings": models.Setting,
    "medications": models.Medication,
    "health_data": models.HealthData,
    "contact_messages": models.ContactMessage,
    "shared_reports": models.SharedReport,
    "visit_observations": models.VisitObservation,
    "shopify_orders": models.ShopifyOrder,
}


def parse_dt(val: Any) -> datetime | None:
    """Convertit ISO string ou datetime en datetime aware UTC."""
    if val is None or val == "":
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            s = val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def coerce_value(col_type: Any, value: Any) -> Any:
    """Convertit une valeur Mongo vers le type Postgres attendu."""
    if value is None:
        return None
    type_str = str(col_type).upper()
    if "TIMESTAMP" in type_str or "DATETIME" in type_str:
        return parse_dt(value)
    if "JSONB" in type_str or "JSON" in type_str:
        return value  # JSONB accepte dict / list / scalar tels quels
    if "INTEGER" in type_str or type_str == "BIGINT":
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    if "FLOAT" in type_str or "REAL" in type_str or "DOUBLE" in type_str or "NUMERIC" in type_str:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    if "BOOLEAN" in type_str:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.lower() in {"1", "true", "yes", "on"}
        return None
    # VARCHAR / TEXT — fallback sur str()
    if isinstance(value, (dict, list)):
        # un champ string a reçu un objet : on jette pour ne pas crasher
        return None
    return str(value)


def project_doc(doc: dict, model_cls: type) -> dict:
    """Coerce le document vers un dict avec TOUTES les colonnes du modèle.

    - Colonne présente : on coerce le type
    - Colonne absente / None + nullable=False + a un default Python → applique le default
    - Sinon : laisse None (ou applique le scalar default si défini)
    """
    mapper = inspect(model_cls)
    out: dict[str, Any] = {}
    for col in mapper.columns:
        key = col.key
        raw = doc.get(key)
        if raw is not None:
            out[key] = coerce_value(col.type, raw)
            continue

        # Valeur absente ou None : on essaie d'appliquer le default
        if col.default is not None:
            arg = col.default.arg
            try:
                if callable(arg):
                    # SA 2.x wrappe les callables pour recevoir un `ctx`
                    try:
                        out[key] = arg(None)
                    except TypeError:
                        out[key] = arg()
                else:
                    out[key] = arg
                continue
            except Exception:
                pass

        # Toujours rien : on laisse None (sera rejeté par Postgres si NOT NULL
        # sans server_default — auquel cas il faut élargir le modèle)
        out[key] = None

    # Génère un id si manquant et la PK est un IdStr unique
    pk_cols = [c.key for c in mapper.primary_key]
    if pk_cols == ["id"] and not out.get("id"):
        # Si PK est auto-incrément (Integer) → on retire la clé du dict pour
        # laisser Postgres générer la valeur. Sinon on génère un UUID.
        id_col = mapper.columns["id"]
        if id_col.autoincrement is True or "INTEGER" in str(id_col.type).upper():
            out.pop("id", None)
        else:
            out["id"] = uuid.uuid4().hex
    # Pour les PK auto-incrémentées (Integer) jamais présentes dans Mongo : retirer
    for pk in pk_cols:
        col = mapper.columns[pk]
        if out.get(pk) is None and (col.autoincrement is True or "INTEGER" in str(col.type).upper()):
            out.pop(pk, None)
    # Vérifie qu'il ne reste pas de PK None bloquante
    for pk in pk_cols:
        if pk in out and out.get(pk) is None:
            raise ValueError(f"PK '{pk}' manquante pour {model_cls.__name__}")
    return out


def migrate_collection(name: str, model_cls: type, batch_size: int = 1000) -> tuple[int, int]:
    """Migre une collection. Retourne (lus, insérés)."""
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ.get("MONGO_DB_NAME", "chutex_db")
    mclient = MongoClient(mongo_url)
    coll = mclient[db_name][name]

    total = coll.estimated_document_count()
    if total == 0:
        log.info("[%s] vide, skip", name)
        return 0, 0

    log.info("[%s] %d documents à migrer", name, total)

    table = model_cls.__table__
    pk_cols = [c.name for c in table.primary_key.columns]
    read = inserted = 0
    batch: list[dict] = []

    def flush(b: list[dict]) -> int:
        if not b:
            return 0
        try:
            with SessionLocal() as session:
                stmt = pg_insert(table).values(b)
                if pk_cols:
                    stmt = stmt.on_conflict_do_nothing(index_elements=pk_cols)
                else:
                    stmt = stmt.on_conflict_do_nothing()
                session.execute(stmt)
                session.commit()
                return len(b)
        except Exception as exc:
            log.warning("[%s] batch failed (%s) → fallback row-by-row", name, type(exc).__name__)
            ok = 0
            for row in b:
                try:
                    with SessionLocal() as session:
                        stmt = pg_insert(table).values([row])
                        if pk_cols:
                            stmt = stmt.on_conflict_do_nothing(index_elements=pk_cols)
                        else:
                            stmt = stmt.on_conflict_do_nothing()
                        session.execute(stmt)
                        session.commit()
                        ok += 1
                except Exception as row_exc:
                    log.debug("[%s] row skipped: %s", name, row_exc)
            return ok

    for doc in coll.find({}):
        doc.pop("_id", None)
        try:
            row = project_doc(doc, model_cls)
        except Exception as exc:
            log.warning("[%s] doc ignoré: %s", name, exc)
            continue
        batch.append(row)
        read += 1
        if len(batch) >= batch_size:
            inserted += flush(batch)
            batch = []
            log.info("[%s] %d / %d", name, read, total)

    inserted += flush(batch)
    log.info("[%s] terminé : %d lus, %d insérés", name, read, inserted)
    return read, inserted


def main(argv: list[str]) -> int:
    targets = argv[1:] or list(COLLECTION_TO_MODEL.keys())
    unknown = [t for t in targets if t not in COLLECTION_TO_MODEL]
    if unknown:
        log.error("Collections inconnues : %s", unknown)
        log.info("Disponibles : %s", sorted(COLLECTION_TO_MODEL))
        return 1

    log.info("Engine cible : %s", sync_engine.url)
    summary: list[tuple[str, int, int]] = []
    for name in targets:
        try:
            r, i = migrate_collection(name, COLLECTION_TO_MODEL[name])
            summary.append((name, r, i))
        except Exception as exc:
            log.exception("[%s] échec : %s", name, exc)
            summary.append((name, -1, -1))

    log.info("==== Résumé ====")
    for name, r, i in summary:
        log.info("  %-40s lus=%-7d insérés=%-7d", name, r, i)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
