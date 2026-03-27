from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import logging, uuid, random
from datetime import datetime, timezone

from database import db, client
from auth import hash_password
from ws_manager import admin_ws, beneficiary_ws

# Import all route modules
from routes.auth_routes import router as auth_router
from routes.device_routes import router as device_router
from routes.alert_routes import router as alert_router
from routes.guardian_routes import router as guardian_router
from routes.admin_routes import router as admin_router
from routes.teleassistance_routes import router as teleassistance_router
from routes.misc_routes import router as misc_router
from routes.subscription_routes import router as subscription_router
from routes.vest_routes import router as vest_router
from routes.bracelet_routes import router as bracelet_router
from routes.carewatch_routes import router as carewatch_router
from routes.company_routes import router as company_router
from routes.push_routes import router as push_router
from routes.health_report_routes import router as health_report_router
from routes.health_aging_routes import router as health_aging_router
from routes.health_sleep_routes import router as health_sleep_router
from routes.health_thresholds_routes import router as health_thresholds_router
from routes.chat_routes import router as chat_router
from routes.program_routes import router as program_router
from routes.rgpd_routes import router as rgpd_router
from routes.contract_routes import router as contract_router
from routes.shopify_routes import router as shopify_router
from routes.advanced_routes import router as advanced_router
from routes.dorsi_routes import router as dorsi_router
from routes.minceur_routes import router as minceur_router
from routes.glycemia_routes import router as glycemia_router
from routes.batch_routes import router as batch_router
from routes.live_status_routes import router as live_status_router
from routes.j2358_routes import router as j2358_router
from routes.program_team_routes import router as program_team_router
from routes.professional_routes import router as professional_router
from routes.pro_subscription_routes import router as pro_sub_router
from routes.pro_application_routes import router as pro_app_router
from routes.escalation_routes import router as escalation_router
from routes.intervention_routes import router as intervention_router
from routes.notification_routes import router as notification_router
from routes.nora_routes import router as nora_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chutex Teleassistance API")
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(device_router)
api_router.include_router(alert_router)
api_router.include_router(guardian_router)
api_router.include_router(admin_router)
api_router.include_router(teleassistance_router)
api_router.include_router(intervention_router)  # Must be before misc_router to avoid route conflict with /interventions/{iid}
api_router.include_router(misc_router)
api_router.include_router(subscription_router)
api_router.include_router(vest_router)
api_router.include_router(bracelet_router)
api_router.include_router(carewatch_router)
api_router.include_router(company_router)
api_router.include_router(push_router)
api_router.include_router(health_report_router)
api_router.include_router(health_aging_router)
api_router.include_router(health_sleep_router)
api_router.include_router(health_thresholds_router)
api_router.include_router(chat_router)
api_router.include_router(program_router)
api_router.include_router(rgpd_router)
api_router.include_router(contract_router)
api_router.include_router(shopify_router)
api_router.include_router(advanced_router)
api_router.include_router(dorsi_router)
api_router.include_router(minceur_router)
api_router.include_router(glycemia_router)
api_router.include_router(batch_router)
api_router.include_router(live_status_router)
api_router.include_router(j2358_router)
api_router.include_router(program_team_router)
api_router.include_router(escalation_router)
api_router.include_router(professional_router)
api_router.include_router(pro_sub_router)
api_router.include_router(pro_app_router)
api_router.include_router(notification_router)
api_router.include_router(nora_router)

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

import os
os.makedirs("/app/backend/uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="/app/backend/uploads"), name="uploads")


# WebSocket endpoint for real-time admin alerts
@app.websocket("/api/ws/admin-alerts")
async def ws_admin_alerts(ws: WebSocket, token: str = Query(None)):
    """WebSocket for real-time alert notifications to admin users."""
    if not token:
        await ws.close(code=4001, reason="Token requis")
        return
    from auth import decode_token
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "role": 1, "id": 1})
        if not user or user.get("role") != "admin":
            await ws.close(code=4003, reason="Admin uniquement")
            return
    except Exception:
        await ws.close(code=4001, reason="Token invalide")
        return

    await admin_ws.connect(ws, user_id)
    try:
        while True:
            await ws.receive_text()  # keep-alive
    except WebSocketDisconnect:
        admin_ws.disconnect(user_id)


# WebSocket endpoint for beneficiary notifications
@app.websocket("/api/ws/beneficiary")
async def ws_beneficiary(ws: WebSocket, token: str = Query(None)):
    """WebSocket for real-time notifications to beneficiary users."""
    if not token:
        await ws.close(code=4001, reason="Token requis")
        return
    from auth import decode_token
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            await ws.close(code=4001, reason="Token invalide")
            return
    except Exception:
        await ws.close(code=4001, reason="Token invalide")
        return

    await beneficiary_ws.connect(ws, user_id)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        beneficiary_ws.disconnect(ws, user_id)


# Security headers middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
async def apply_password_overrides():
    """Apply persisted password overrides on startup (survives DB snapshots)."""
    import json, os
    override_path = os.path.join(os.path.dirname(__file__), "password_overrides.json")
    if os.path.exists(override_path):
        try:
            with open(override_path, "r") as f:
                overrides = json.load(f)
            for user_id, pw_hash in overrides.items():
                result = await db.users.update_one({"id": user_id}, {"$set": {"password_hash": pw_hash}})
                if result.modified_count > 0:
                    logger.info(f"Password override applied for user {user_id}")
        except Exception as e:
            logger.error(f"Error applying password overrides: {e}")


@app.on_event("startup")
async def seed_demo_data():
    """Seed demo data for testing"""
    demo_accounts = [
        {"email": "admin@chutex.fr", "name": "Directeur Chutex", "phone": "+33600000001", "role": "admin"},
        {"email": "robert.martin@email.fr", "name": "Robert Martin", "phone": "+33651245918", "role": "beneficiary",
         "date_of_birth": "15/03/1952", "gender": "Homme", "address": "14 rue de la Republique, 42400 Saint-Chamond",
         "height_cm": 175, "weight_kg": 72, "blood_type": "A+", "allergies": "Penicilline",
         "medical_conditions": "Hypertension legere, arthrose", "emergency_contact_name": "Claire Martin",
         "emergency_contact_phone": "+33630686585", "doctor_name": "Dr. Lefevre",
         "latitude": 45.4737, "longitude": 4.5134},
        {"email": "claire.martin@email.fr", "name": "Claire Martin", "phone": "+33630686585", "role": "guardian",
         "guardian_type": "particular", "relationship": "Fille"},
        {"email": "plateau@chutex.fr", "name": "Plateau Ecoute Chutex", "phone": "+33477101011", "role": "teleassistance"},
        {"email": "ludivine.moutio@care.fr", "name": "Ludivine Moutio", "phone": "+33477223344", "role": "guardian",
         "guardian_type": "professional", "profession": "Infirmiere liberale", "structure_name": "Cabinet Infirmier Saint-Etienne",
         "is_intervention_provider": True, "intervention_radius_km": 30,
         "address": "8 place Jean Jaures, 42000 Saint-Etienne",
         "latitude": 45.4397, "longitude": 4.3872},
    ]
    for acct in demo_accounts:
        existing = await db.users.find_one({"email": acct["email"]})
        if not existing:
            uid = str(uuid.uuid4())
            user = {
                "id": uid, "email": acct["email"], "password_hash": hash_password("demo123"),
                "name": acct["name"], "phone": acct.get("phone", ""), "role": acct["role"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "beneficiaries": [], "guardians": [], "location_sharing": "alert_only",
                "date_of_birth": acct.get("date_of_birth", ""), "gender": acct.get("gender", ""),
                "address": acct.get("address", ""),
                "height_cm": acct.get("height_cm"), "weight_kg": acct.get("weight_kg"),
                "blood_type": acct.get("blood_type", ""), "allergies": acct.get("allergies", ""),
                "medical_conditions": acct.get("medical_conditions", ""),
                "emergency_contact_name": acct.get("emergency_contact_name", ""),
                "emergency_contact_phone": acct.get("emergency_contact_phone", ""),
                "doctor_name": acct.get("doctor_name", ""),
                "guardian_type": acct.get("guardian_type", ""), "structure_name": acct.get("structure_name", ""),
                "siret": "", "profession": "", "relationship": acct.get("relationship", ""),
                "is_prescriber": acct.get("is_prescriber", False), "prescriber_structure": acct.get("structure_name", ""), "prescriber_code_used": "",
                "is_intervention_provider": acct.get("is_intervention_provider", False),
                "intervention_radius_km": acct.get("intervention_radius_km", 30),
                "latitude": acct.get("latitude"), "longitude": acct.get("longitude"),
            }
            await db.users.insert_one(user)
            if acct["role"] == "beneficiary":
                for dt, nm in [("bracelet", "Bracelet Sante"), ("scale", "Balance Connectee"), ("vest", "Gilet Anti-Chute")]:
                    await db.devices.insert_one({"id": str(uuid.uuid4()), "user_id": uid, "device_type": dt, "name": nm, "connected": False, "battery": random.randint(60, 95), "last_sync": None})
            logger.info(f"Seed: created {acct['email']} ({acct['role']})")
    # Link guardian to beneficiary if not linked
    ben = await db.users.find_one({"email": "robert.martin@email.fr"}, {"_id": 0})
    guard = await db.users.find_one({"email": "claire.martin@email.fr"}, {"_id": 0})
    if ben and guard:
        if guard['id'] not in ben.get('guardians', []):
            await db.users.update_one({"id": ben['id']}, {"$addToSet": {"guardians": guard['id']}})
            await db.users.update_one({"id": guard['id']}, {"$addToSet": {"beneficiaries": ben['id']}})
            logger.info("Seed: linked guardian <-> beneficiary")

    # Seed demo subscription for Robert Martin (Care)
    if ben:
        existing_sub = await db.subscriptions.find_one({"beneficiary_id": ben['id']})
        if not existing_sub:
            await db.subscriptions.insert_one({
                "id": str(uuid.uuid4()),
                "beneficiary_phone": ben.get('phone', '+33651245918'),
                "beneficiary_id": ben['id'],
                "subscription_type": "care",
                "status": "active",
                "source": "manual",
                "shopify_order_id": "",
                "notes": "Compte demo - Abonnement Care",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": "seed",
            })
            await db.users.update_one(
                {"id": ben['id']},
                {"$set": {"subscription_type": "care", "has_subscription": True}}
            )
            logger.info("Seed: created Care subscription for Robert Martin")

    # Seed activation codes with id field
    now = datetime.now(timezone.utc).isoformat()
    seed_act_codes = [
        {"code": "PRESC-DOC-01", "structure_name": "Cabinet Medical Saint-Chamond", "raison_sociale": "Dr. Lefevre SELARL", "siret": "44455566600012"},
        {"code": "PRESC-INF-01", "structure_name": "Cabinet Infirmier du Forez", "raison_sociale": "SCI Infirmieres du Forez", "siret": "55566677700034"},
        {"code": "PRESC-SAAD-01", "structure_name": "SAAD Aide a Domicile", "raison_sociale": "Association Aide a Domicile Loire", "siret": "66677788800056"},
    ]
    for ac in seed_act_codes:
        existing = await db.activation_codes.find_one({"code": ac["code"]})
        if existing and not existing.get("id"):
            await db.activation_codes.update_one({"code": ac["code"]}, {"$set": {"id": str(uuid.uuid4())}})
            logger.info(f"Seed: fixed missing id on activation code {ac['code']}")
        elif not existing:
            await db.activation_codes.insert_one({
                "id": str(uuid.uuid4()), "code": ac["code"], "structure_name": ac["structure_name"],
                "raison_sociale": ac.get("raison_sociale", ""), "siret": ac.get("siret", ""),
                "tva": "", "adresse": "", "telephone": "", "email_contact": "",
                "max_uses": 50, "uses_count": 0, "active": True, "created_at": now, "created_by": "seed",
            })
            logger.info(f"Seed: created activation code {ac['code']}")

    # Seed intervention codes with id field
    seed_iv_codes = [
        {"code": "CARE-STETI-01", "structure_name": "Cabinet Infirmier Saint-Etienne", "radius_km": 30},
        {"code": "CARE-PARIS-01", "structure_name": "ABC Domicile Paris", "radius_km": 50},
        {"code": "CARE-LYON-01", "structure_name": "ABC Domicile Lyon", "radius_km": 40},
    ]
    for ic in seed_iv_codes:
        existing = await db.intervention_codes.find_one({"code": ic["code"]})
        if existing and not existing.get("id"):
            await db.intervention_codes.update_one({"code": ic["code"]}, {"$set": {"id": str(uuid.uuid4())}})
            logger.info(f"Seed: fixed missing id on intervention code {ic['code']}")
        elif not existing:
            await db.intervention_codes.insert_one({
                "id": str(uuid.uuid4()), "code": ic["code"], "structure_name": ic["structure_name"],
                "default_radius_km": ic.get("radius_km", 30),
                "raison_sociale": "", "siret": "", "tva": "", "adresse": "", "telephone": "", "email_contact": "",
                "max_uses": 50, "uses_count": 0, "active": True,
                "base_location": {"latitude": 48.8566, "longitude": 2.3522},
                "created_at": now, "created_by": "seed",
            })
            logger.info(f"Seed: created intervention code {ic['code']}")

    # Seed hydration reminders and guardian request for Robert Martin
    if ben:
        # Hydration reminders
        existing_rem = await db.reminders.find_one({"user_id": ben['id'], "type": "hydration"})
        if not existing_rem:
            for time_str in ["07:30", "10:00", "13:00", "16:00", "19:00"]:
                await db.reminders.insert_one({
                    "id": str(uuid.uuid4()), "user_id": ben['id'], "type": "hydration",
                    "time": time_str, "enabled": True, "label": f"Boire un verre d'eau",
                    "created_at": now,
                })
            logger.info("Seed: created hydration reminders for Robert Martin")

        # Guardian request (pending)
        existing_req = await db.guardian_requests.find_one({"beneficiary_id": ben['id'], "status": "pending"})
        if not existing_req:
            await db.guardian_requests.insert_one({
                "id": str(uuid.uuid4()), "beneficiary_id": ben['id'],
                "beneficiary_name": ben.get('name', 'Robert Martin'),
                "guardian_phone": "+33612345678", "guardian_name": "Pierre Durand",
                "relationship": "Voisin", "type": "particular",
                "status": "pending", "created_at": now,
            })
            logger.info("Seed: created pending guardian request for Robert Martin")

    # Seed SAAD/Company demo account
    existing_saad = await db.users.find_one({"email": "saad@aide-domicile.fr"})
    if not existing_saad:
        saad_uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": saad_uid, "email": "saad@aide-domicile.fr", "password_hash": hash_password("demo123"),
            "name": "Marie Dupont", "phone": "+33499887766", "role": "prescriber_company",
            "created_at": now, "beneficiaries": [], "guardians": [],
            "structure_name": "SAAD Aide a Domicile Loire", "siret": "66677788800056",
            "location_sharing": "alert_only", "date_of_birth": "", "gender": "Femme",
            "address": "12 rue de la Loire, 42000 Saint-Etienne",
            "guardian_type": "", "relationship": "", "is_prescriber": True,
            "prescriber_structure": "SAAD Aide a Domicile Loire", "prescriber_code_used": "PRESC-SAAD-01",
        })
        logger.info("Seed: created SAAD company account (Marie Dupont)")



@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ── J2358 TCP Server — launch in background on startup ──
@app.on_event("startup")
async def start_j2358_tcp():
    """Start the J2358 V6 bracelet TCP server as a background task."""
    import asyncio
    from services.j2358_tcp_server import start_tcp_server
    asyncio.create_task(start_tcp_server())
    logger.info("J2358 TCP server task launched")

