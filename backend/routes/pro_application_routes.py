"""
Routes for Coach/Physio professional applications.
When someone applies via the landing page, we store their application,
auto-validate if all fields are provided, send confirmation SMS+email,
and when they register as Guardian with the same phone, we activate professional_type.
"""
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from database import db
from services.smsmode_service import send_sms
from services.email_service import send_welcome_email

logger = logging.getLogger(__name__)
router = APIRouter()


class ProApplicationCreate(BaseModel):
    type: str = Field(..., description="coach or physio")
    first_name: str
    last_name: str
    phone: str
    email: str
    city: str
    postal_code: str = ""
    diploma: str = ""
    diploma_year: str = ""
    specialization: str = ""
    adeli_rpps: str = ""
    siret: str = ""
    current_situation: str = ""
    current_clients: int = 0
    motivation: str = ""
    signer_name: str = ""
    contract_accepted: bool = False


CONTRACT_COACH_TEXT = """CONTRAT DE PARTENARIAT CHUTEX - COACH SPORTIF

Article 1 - Objet
Le present contrat a pour objet la mise en place d'un partenariat entre Chutex Innovation et le Coach Sportif pour le suivi des beneficiaires ayant souscrit un abonnement "Sport" via la plateforme Chutex Care.

Article 2 - Obligations du Coach
Le Coach s'engage a :
- Suivre les beneficiaires qui souscrivent a un abonnement Sport via la plateforme
- Definir et adapter les programmes d'exercices personnalises
- Assurer un suivi regulier via la messagerie integree
- Repondre aux sollicitations dans un delai de 24h ouvrables

Article 3 - Remuneration
Le Coach percoit une remuneration de 45 EUR HT par mois et par beneficiaire actif.
Le paiement est effectue mensuellement par virement bancaire.

Article 4 - Duree et Resiliation
Le contrat est conclu pour une duree indeterminee. Chaque partie peut le resilier avec un preavis de 30 jours.

Article 5 - Confidentialite
Le Coach s'engage a respecter la confidentialite des donnees de sante des beneficiaires conformement au RGPD.

Article 6 - Responsabilite
Le Coach exerce en son nom propre et sous sa propre responsabilite professionnelle."""

CONTRACT_PHYSIO_TEXT = """CONTRAT DE PARTENARIAT CHUTEX - KINESITHERAPEUTE / OSTEOPATHE

Article 1 - Objet
Le present contrat a pour objet la mise en place d'un partenariat entre Chutex Innovation et le Kinesitherapeute/Osteopathe pour le suivi des beneficiaires ayant souscrit un abonnement "Physio" via la plateforme Chutex Care.

Article 2 - Obligations du Professionnel
Le Professionnel s'engage a :
- Suivre les beneficiaires qui souscrivent a un abonnement Physio via la plateforme
- Definir et adapter les programmes de reeducation personnalises
- Assurer un suivi regulier via la messagerie integree
- Repondre aux sollicitations dans un delai de 24h ouvrables

Article 3 - Remuneration
Le Professionnel percoit une remuneration de 45 EUR HT par mois et par beneficiaire actif.
Le paiement est effectue mensuellement par virement bancaire.

Article 4 - Duree et Resiliation
Le contrat est conclu pour une duree indeterminee. Chaque partie peut le resilier avec un preavis de 30 jours.

Article 5 - Confidentialite
Le Professionnel s'engage a respecter la confidentialite des donnees de sante des beneficiaires conformement au RGPD.

Article 6 - Responsabilite
Le Professionnel exerce en son nom propre et sous sa propre responsabilite professionnelle.
Le Professionnel doit etre titulaire d'un diplome d'Etat et etre inscrit au registre ADELI/RPPS."""


@router.get("/pro/application/contract/{pro_type}")
async def get_contract_text(pro_type: str):
    if pro_type == "coach":
        return {"contract_text": CONTRACT_COACH_TEXT, "type": "coach"}
    elif pro_type == "physio":
        return {"contract_text": CONTRACT_PHYSIO_TEXT, "type": "physio"}
    else:
        raise HTTPException(status_code=400, detail="Type invalide: coach ou physio")


@router.post("/pro/application")
async def create_pro_application(data: ProApplicationCreate):
    if data.type not in ("coach", "physio"):
        raise HTTPException(status_code=400, detail="Type invalide: coach ou physio")

    if not data.contract_accepted:
        raise HTTPException(status_code=400, detail="Vous devez accepter le contrat")

    if not data.signer_name.strip():
        raise HTTPException(status_code=400, detail="Signature requise")

    required = [data.first_name, data.last_name, data.phone, data.email, data.city, data.diploma]
    if not all(f.strip() for f in required):
        raise HTTPException(status_code=400, detail="Tous les champs obligatoires doivent etre remplis")

    if data.type == "physio" and not data.adeli_rpps.strip():
        raise HTTPException(status_code=400, detail="Le numero ADELI/RPPS est obligatoire pour les kinesitherapeutes")

    phone_clean = data.phone.strip().replace(" ", "").replace(".", "").replace("-", "")
    if not phone_clean.startswith("+"):
        if phone_clean.startswith("0"):
            phone_clean = "+33" + phone_clean[1:]
        else:
            phone_clean = "+33" + phone_clean

    existing = await db.pro_applications.find_one({"phone": phone_clean, "type": data.type, "status": {"$in": ["approved", "pending"]}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Une candidature existe deja pour ce numero")

    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    application = {
        "id": app_id,
        "type": data.type,
        "first_name": data.first_name.strip(),
        "last_name": data.last_name.strip(),
        "phone": phone_clean,
        "email": data.email.strip().lower(),
        "city": data.city.strip(),
        "postal_code": data.postal_code.strip(),
        "diploma": data.diploma.strip(),
        "diploma_year": data.diploma_year.strip(),
        "specialization": data.specialization.strip(),
        "adeli_rpps": data.adeli_rpps.strip(),
        "siret": data.siret.strip(),
        "current_situation": data.current_situation.strip(),
        "current_clients": data.current_clients,
        "motivation": data.motivation.strip(),
        "signer_name": data.signer_name.strip(),
        "contract_accepted": True,
        "contract_signed_at": now,
        "status": "approved",
        "created_at": now,
        "updated_at": now,
    }

    await db.pro_applications.insert_one(application)

    pro_label = "Coach Sportif" if data.type == "coach" else "Kinesitherapeute/Osteopathe"
    sms_text = (
        f"Bienvenue chez Chutex ! Votre candidature {pro_label} a ete validee. "
        f"Inscrivez-vous sur l'application Chutex en tant que Gardien avec le numero {phone_clean} "
        f"pour activer votre espace professionnel. Remuneration: 45 EUR HT/mois/beneficiaire."
    )
    try:
        await send_sms(phone_clean, sms_text)
    except Exception as e:
        logger.warning(f"SMS send failed for pro application {app_id}: {e}")

    try:
        await send_welcome_email(
            f"{data.first_name} {data.last_name}",
            data.email,
            phone_clean,
        )
    except Exception as e:
        logger.warning(f"Email send failed for pro application {app_id}: {e}")

    return {
        "id": app_id,
        "status": "approved",
        "message": f"Candidature validee ! Un SMS et un email de confirmation vous ont ete envoyes. Inscrivez-vous sur l'application Chutex en tant que Gardien avec le numero {phone_clean} pour activer votre espace {pro_label}."
    }


@router.get("/pro/application/check/{phone}")
async def check_pro_application(phone: str):
    phone_clean = phone.strip().replace(" ", "").replace(".", "").replace("-", "")
    if not phone_clean.startswith("+"):
        if phone_clean.startswith("0"):
            phone_clean = "+33" + phone_clean[1:]
        else:
            phone_clean = "+33" + phone_clean

    app = await db.pro_applications.find_one(
        {"phone": phone_clean, "status": "approved"},
        {"_id": 0, "id": 1, "type": 1, "first_name": 1, "last_name": 1, "status": 1}
    )
    if app:
        return {"has_approved_application": True, "application": app}
    return {"has_approved_application": False}
