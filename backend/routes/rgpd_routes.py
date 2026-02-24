from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid

from database import db
from auth import get_current_user
from utils import send_email

router = APIRouter()


class RGPDRequest(BaseModel):
    right_type: str  # access, deletion, opposition, portability
    message: Optional[str] = ""


class ConsentUpdate(BaseModel):
    consent_type: str  # health_data, privacy_policy, cgu
    accepted: bool


RGPD_RIGHTS = {
    "access": "Droit d'acces",
    "deletion": "Droit a la suppression",
    "opposition": "Droit d'opposition",
    "portability": "Droit a la portabilite",
}

DPO_EMAIL = "contact@chutex-innovation.com"


@router.post("/rgpd/request")
async def submit_rgpd_request(data: RGPDRequest, user=Depends(get_current_user)):
    right_label = RGPD_RIGHTS.get(data.right_type, data.right_type)
    request_id = str(uuid.uuid4())[:8].upper()

    record = {
        "id": request_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "user_phone": user.get("phone", ""),
        "right_type": data.right_type,
        "right_label": right_label,
        "message": data.message or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rgpd_requests.insert_one(record)

    # Send email to DPO
    subject = f"RGPD - {right_label} - {user.get('name', 'Utilisateur')}"
    html = f"""
    <h2>Demande RGPD - {right_label}</h2>
    <p><strong>Ref:</strong> {request_id}</p>
    <p><strong>Utilisateur:</strong> {user.get('name', '')} ({user.get('email', '')})</p>
    <p><strong>Telephone:</strong> {user.get('phone', '')}</p>
    <p><strong>Droit exerce:</strong> {right_label}</p>
    <p><strong>Message:</strong> {data.message or 'Aucun message'}</p>
    <p><strong>Date:</strong> {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}</p>
    <hr>
    <p><em>Delai legal de reponse : 30 jours maximum (Art. 12.3 RGPD)</em></p>
    """
    await send_email(DPO_EMAIL, subject, html)

    return {
        "status": "sent",
        "request_id": request_id,
        "message": f"Votre demande de {right_label.lower()} a ete enregistree (ref: {request_id}). Nous vous repondrons sous 30 jours maximum.",
    }


@router.get("/rgpd/requests")
async def get_my_rgpd_requests(user=Depends(get_current_user)):
    requests = await db.rgpd_requests.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return requests


@router.post("/consent/update")
async def update_consent(data: ConsentUpdate, user=Depends(get_current_user)):
    await db.user_consents.update_one(
        {"user_id": user["id"], "consent_type": data.consent_type},
        {"$set": {
            "user_id": user["id"],
            "consent_type": data.consent_type,
            "accepted": data.accepted,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "ip_address": "web",
        }},
        upsert=True,
    )
    return {"status": "updated"}


@router.get("/consent/status")
async def get_consent_status(user=Depends(get_current_user)):
    consents = await db.user_consents.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(20)
    result = {}
    for c in consents:
        result[c["consent_type"]] = {
            "accepted": c["accepted"],
            "updated_at": c.get("updated_at", ""),
        }
    return result


@router.get("/legal/privacy-policy")
async def get_privacy_policy():
    return {"content": PRIVACY_POLICY}


@router.get("/legal/cgu")
async def get_cgu():
    return {"content": CGU_TEXT}


@router.get("/legal/mentions")
async def get_legal_mentions():
    return {"content": MENTIONS_LEGALES}


PRIVACY_POLICY = """
POLITIQUE DE CONFIDENTIALITE - CARE WATCH

Derniere mise a jour : Fevrier 2026

1. RESPONSABLE DU TRAITEMENT
Chutex Innovation SAS
Adresse : France
Email DPO : contact@chutex-innovation.com

2. DONNEES COLLECTEES
Nous collectons les categories de donnees suivantes :
- Donnees d'identification : nom, prenom, email, telephone, adresse
- Donnees de sante (donnees sensibles Art. 9 RGPD) : frequence cardiaque, tension arterielle, SpO2, temperature, poids, composition corporelle, qualite du sommeil, ECG, donnees d'activite physique
- Donnees de geolocalisation : position GPS pour la detection de chute et l'envoi d'intervenants
- Donnees de connexion : logs, adresse IP, appareil utilise

3. FINALITES DU TRAITEMENT
- Suivi de sante preventif et personnalise
- Detection d'anomalies et alertes aux gardiens/proches
- Teleassistance et envoi d'intervenants en cas d'urgence
- Analyse IA pour recommandations de sante (assistant Nora)
- Amelioration continue du service

4. BASE LEGALE
- Consentement explicite de l'utilisateur (Art. 6.1.a et Art. 9.2.a RGPD) pour les donnees de sante
- Execution du contrat (Art. 6.1.b) pour la fourniture du service
- Interet legitime (Art. 6.1.f) pour la securite et l'amelioration du service

5. DUREE DE CONSERVATION
- Donnees de sante : 5 ans apres la derniere utilisation du service, ou sur demande de suppression
- Donnees de compte : duree de la relation contractuelle + 3 ans
- Logs de connexion : 12 mois

6. DESTINATAIRES DES DONNEES
- Equipe Chutex Innovation (acces restreint)
- Gardiens et prescripteurs designes par l'utilisateur
- Plateaux d'ecoute en cas d'alerte
- Sous-traitants techniques (hebergement cloud, IA) sous contrat RGPD
- Aucune vente de donnees a des tiers

7. TRANSFERTS INTERNATIONAUX
Les donnees sont hebergees en Europe. En cas de transfert hors UE (services cloud), des garanties appropriees sont mises en place (clauses contractuelles types).

8. VOS DROITS (Art. 15 a 22 RGPD)
Vous disposez des droits suivants :
- Droit d'acces : obtenir une copie de vos donnees
- Droit de rectification : corriger vos donnees
- Droit a l'effacement : demander la suppression de vos donnees
- Droit d'opposition : vous opposer au traitement
- Droit a la portabilite : recevoir vos donnees dans un format structure
- Droit de retrait du consentement : a tout moment, sans affecter la legalite du traitement anterieur

Pour exercer vos droits : contact@chutex-innovation.com ou via l'application (Profil > Gestion des donnees).
Delai de reponse : 30 jours maximum.

9. SECURITE
Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees : chiffrement des donnees, controle d'acces, pseudonymisation, sauvegardes regulieres.

10. RECLAMATION
Vous pouvez introduire une reclamation aupres de la CNIL : www.cnil.fr

11. COOKIES
L'application utilise des cookies strictement necessaires au fonctionnement du service. Aucun cookie publicitaire ou de tracking n'est utilise.

12. MODIFICATION
Cette politique peut etre mise a jour. Vous serez informe de tout changement substantiel.
"""

CGU_TEXT = """
CONDITIONS GENERALES D'UTILISATION - CARE WATCH

Derniere mise a jour : Fevrier 2026

1. OBJET
Les presentes CGU regissent l'utilisation de l'application CARE WATCH editee par Chutex Innovation SAS.

2. DESCRIPTION DU SERVICE
CARE WATCH est une application de teleassistance et de suivi de sante preventif. Elle permet :
- Le suivi des constantes vitales via des dispositifs connectes (bracelet, balance, gilet)
- La detection de chutes et l'envoi d'alertes
- L'assistance par un plateau d'ecoute 24/7
- Le suivi par des gardiens et prescripteurs
- Des recommandations de sante personnalisees par IA

3. INSCRIPTION ET COMPTE
L'utilisateur doit fournir des informations exactes lors de l'inscription. Il est responsable de la confidentialite de ses identifiants.

4. DONNEES DE SANTE
L'utilisateur consent explicitement au traitement de ses donnees de sante conformement a la politique de confidentialite. Ce consentement peut etre retire a tout moment.

5. RESPONSABILITES
- CARE WATCH est un outil d'aide et de prevention. Il ne remplace pas un avis medical.
- Les recommandations IA (Nora) sont informatives et ne constituent pas un diagnostic.
- Chutex Innovation ne saurait etre tenu responsable en cas de defaillance des dispositifs connectes.

6. PROPRIETE INTELLECTUELLE
L'application, son contenu et ses fonctionnalites sont la propriete de Chutex Innovation SAS.

7. RESILIATION
L'utilisateur peut supprimer son compte a tout moment via l'application ou en contactant contact@chutex-innovation.com.

8. LOI APPLICABLE
Les presentes CGU sont soumises au droit francais. Tout litige releve de la competence des tribunaux francais.
"""

MENTIONS_LEGALES = """
MENTIONS LEGALES

EDITEUR
Chutex Innovation SAS
Email : contact@chutex-innovation.com
Directeur de la publication : Chutex Innovation

HEBERGEMENT
Les donnees sont hebergees sur des serveurs securises en Europe.

PROPRIETE INTELLECTUELLE
L'ensemble du contenu de l'application CARE WATCH (textes, images, logiciels, base de donnees) est protege par le droit de la propriete intellectuelle.

DONNEES PERSONNELLES
Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique et Libertes, vous disposez de droits sur vos donnees personnelles. Consultez notre Politique de confidentialite pour plus d'informations.

CONTACT DPO
Pour toute question relative a vos donnees personnelles : contact@chutex-innovation.com

RECLAMATION CNIL
Commission Nationale de l'Informatique et des Libertes (CNIL)
3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
www.cnil.fr
"""
