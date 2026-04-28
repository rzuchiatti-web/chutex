"""Routes Intervention : QCM, accept, location, detail, close."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import Alert, Escalation, Intervention

router = APIRouter()


class InterventionAcceptRequest(BaseModel):
    intervention_id: str


class InterventionCloseRequest(BaseModel):
    intervention_id: str
    answers: list = []
    notes: str | None = None


class InterventionLocationUpdate(BaseModel):
    intervention_id: str
    latitude: float
    longitude: float


INTERVENTION_CLOSE_QCM = [
    {"id": "q1", "question": "Etat du beneficiaire a votre arrivee ?", "options": ["Conscient et lucide", "Conscient mais confus", "Inconscient", "Blesse legerement", "Blesse gravement"]},
    {"id": "q2", "question": "Le beneficiaire pouvait-il se deplacer ?", "options": ["Oui, sans aide", "Oui, avec aide", "Non, immobilise"]},
    {"id": "q3", "question": "Quelle etait la cause de l'alerte ?", "options": ["Chute confirmee", "Malaise", "Fausse alerte", "Probleme technique", "Autre"]},
    {"id": "q4", "question": "Actions effectuees sur place ?", "options": ["Rassure et accompagne", "Premiers soins administres", "Appel SAMU/pompiers", "Mise en securite", "Aucune action necessaire"]},
    {"id": "q5", "question": "Un suivi medical est-il necessaire ?", "options": ["Non, tout va bien", "Consultation medecin recommandee", "Oui, urgence medicale", "Deja pris en charge par les secours"]},
    {"id": "q6", "question": "Recommandations pour la suite ?", "options": ["Aucune, situation normale", "Surveillance renforcee les prochaines heures", "Visite medicale sous 24h", "Hospitalisation recommandee", "Adaptation du domicile necessaire"]},
]


@router.get("/intervention/close-qcm")
async def get_intervention_close_qcm():
    return INTERVENTION_CLOSE_QCM


@router.get("/interventions/pending")
async def get_pending_interventions(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Intervention).where(
            Intervention.status.in_(["pending", "in_progress"]),
            or_(
                Intervention.intervenant_id == user["id"],
                Intervention.structure_id == (user.get("structure_id") or ""),
            ),
        ).order_by(Intervention.created_at.desc()).limit(40)
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.post("/intervention/accept")
async def accept_intervention(
    data: InterventionAcceptRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Intervention).where(Intervention.id == data.intervention_id))
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Intervention non trouvee")
    if iv.status not in ("pending", "dispatched"):
        raise HTTPException(400, "Intervention deja prise en charge")
    now = utcnow()
    iv.status = "in_progress"
    iv.intervenant_id = user["id"]
    iv.intervenant_name = user.get("name", "")
    iv.accepted_at = now
    if iv.alert_id:
        ar = await session.execute(select(Alert).where(Alert.id == iv.alert_id))
        alert = ar.scalar_one_or_none()
        if alert:
            alert.teleassistance_status = "intervenant_en_route"
    await session.commit()
    return {"status": "in_progress", "accepted_by": user.get("name", ""), "intervention_id": data.intervention_id}


@router.post("/intervention/location")
async def update_intervener_location(
    data: InterventionLocationUpdate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Intervention).where(
            Intervention.id == data.intervention_id,
            Intervention.intervenant_id == user["id"],
        )
    )
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Intervention non trouvee")
    iv.latitude = data.latitude
    iv.longitude = data.longitude
    await session.commit()
    return {"status": "ok"}


@router.get("/intervention/{iid}")
async def get_intervention_detail(
    iid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Intervention).where(Intervention.id == iid))
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Intervention non trouvee")
    return row_to_dict(iv)


@router.post("/intervention/close")
async def close_intervention(
    data: InterventionCloseRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Intervention).where(Intervention.id == data.intervention_id))
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Intervention non trouvee")
    if not data.answers or len(data.answers) < len(INTERVENTION_CLOSE_QCM):
        raise HTTPException(400, f"Veuillez repondre aux {len(INTERVENTION_CLOSE_QCM)} questions du compte-rendu")
    now = utcnow()
    iv.status = "completed"
    iv.closed_at = now
    iv.answers = data.answers
    iv.notes = data.notes
    iv.report = (data.notes or "")
    if iv.alert_id:
        ar = await session.execute(select(Alert).where(Alert.id == iv.alert_id))
        alert = ar.scalar_one_or_none()
        if alert:
            alert.status = "resolved"
            alert.resolved_at = now
            alert.resolved_by = user["id"]
            alert.teleassistance_status = "resolved"
        # Resolve escalations on this alert too
        er = await session.execute(select(Escalation).where(Escalation.alert_id == iv.alert_id))
        for esc in er.scalars().all():
            esc.status = "resolved"
    await session.commit()
    return {"status": "completed"}
