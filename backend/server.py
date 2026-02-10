from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging, uuid, random
from datetime import datetime, timezone

from database import db, client
from auth import hash_password

# Import all route modules
from routes.auth_routes import router as auth_router
from routes.device_routes import router as device_router
from routes.health_routes import router as health_router
from routes.alert_routes import router as alert_router
from routes.guardian_routes import router as guardian_router
from routes.admin_routes import router as admin_router
from routes.teleassistance_routes import router as teleassistance_router
from routes.misc_routes import router as misc_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chutex Teleassistance API")
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(device_router)
api_router.include_router(health_router)
api_router.include_router(alert_router)
api_router.include_router(guardian_router)
api_router.include_router(admin_router)
api_router.include_router(teleassistance_router)
api_router.include_router(misc_router)

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
async def seed_demo_data():
    """Create demo accounts if they don't exist"""
    demo_accounts = [
        {"email": "admin@chutex.fr", "name": "Directeur Chutex", "phone": "+33600000001", "role": "admin"},
        {"email": "robert.martin@email.fr", "name": "Robert Martin", "phone": "+33651245918", "role": "beneficiary",
         "date_of_birth": "15/03/1952", "gender": "Homme", "address": "12 rue de la Sante, 75014 Paris",
         "height_cm": 175, "weight_kg": 72, "blood_type": "A+", "allergies": "Penicilline",
         "medical_conditions": "Hypertension legere, arthrose", "emergency_contact_name": "Claire Martin",
         "emergency_contact_phone": "+33630686585", "doctor_name": "Dr. Lefevre"},
        {"email": "claire.martin@email.fr", "name": "Claire Martin", "phone": "+33630686585", "role": "guardian",
         "guardian_type": "particular", "relationship": "Fille"},
        {"email": "plateau@chutex.fr", "name": "Plateau Ecoute Chutex", "phone": "+33477101011", "role": "teleassistance"},
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
                "is_prescriber": False, "prescriber_structure": "", "prescriber_code_used": "",
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
