"""Routes Advanced — Nora weekly report, morning briefing, predictive checks.

Implémentation Phase 1 : retours en cache (caches journaliers/hebdomadaires)
+ déclenchement LLM via emergentintegrations si EMERGENT_LLM_KEY est définie.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import PredictiveAlert
from app.models.health import HealthVital, LatestVitals
from app.models.misc import (
    NoraAnalysisCache,
    NoraHealthAnalysisCache,
    UserStreak,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _today() -> str:
    return utcnow().date().isoformat()


def _llm_available() -> bool:
    return bool(os.environ.get("EMERGENT_LLM_KEY"))


async def _llm_quick(system: str, prompt: str) -> str:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
        import uuid as _uuid
        chat = LlmChat(
            api_key=api_key,
            session_id=f"nora-{_uuid.uuid4().hex[:8]}",
            system_message=system,
        ).with_model("openai", "gpt-5.2")
        r = await chat.send_message(UserMessage(text=prompt))
        return (r or "").strip()
    except Exception as e:
        logger.error("LLM error: %s", e)
        return ""


@router.get("/nora/weekly-report")
async def get_weekly_report(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Retourne le rapport hebdo (cache). Génère via LLM si absent."""
    cache_key = f"weekly-{user['id']}-{_today()}"
    res = await session.execute(
        select(NoraAnalysisCache).where(NoraAnalysisCache.cache_key == cache_key)
    )
    cached = res.scalar_one_or_none()
    if cached:
        return row_to_dict(cached)

    # Compose un résumé minimal des 7 derniers jours
    since = utcnow() - timedelta(days=7)
    vr = await session.execute(
        select(HealthVital).where(
            HealthVital.user_id == user["id"], HealthVital.timestamp >= since
        ).order_by(HealthVital.timestamp.desc()).limit(50)
    )
    vitals = list(vr.scalars().all())
    summary = {
        "samples": len(vitals),
        "avg_hr": (
            round(sum(v.heart_rate or 0 for v in vitals) / max(len(vitals), 1), 1)
            if vitals else 0
        ),
        "avg_spo2": (
            round(sum(v.spo2 or 0 for v in vitals) / max(len(vitals), 1), 1)
            if vitals else 0
        ),
    }
    analysis = await _llm_quick(
        "Tu es Nora, IA de prevention sante. Reponds en francais, ton serieux.",
        f"Voici le resume hebdo des constantes du patient :\n{summary}\n"
        f"Genere un rapport hebdomadaire concis (max 6 phrases) avec recommandations.",
    )
    if not analysis:
        analysis = (
            f"Sur les 7 derniers jours, {summary['samples']} mesures ont ete enregistrees. "
            f"Frequence cardiaque moyenne : {summary['avg_hr']} bpm, "
            f"saturation moyenne : {summary['avg_spo2']}%. Continuez votre suivi."
        )
    payload = {"summary": summary, "analysis": analysis, "generated_at": utcnow().isoformat()}
    payload_str = json.dumps(payload, ensure_ascii=False)
    stmt = pg_insert(NoraAnalysisCache).values(
        cache_key=cache_key, user_id=user["id"],
        date=_today(), context="weekly_report",
        analysis=payload_str, created_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[NoraAnalysisCache.cache_key],
        set_={"analysis": payload_str, "created_at": utcnow()},
    )
    await session.execute(stmt)
    await session.commit()
    return {"cache_key": cache_key, "analysis": payload}


@router.get("/nora/morning-briefing")
async def morning_briefing(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cache_key = f"morning-{user['id']}-{_today()}"
    res = await session.execute(
        select(NoraAnalysisCache).where(NoraAnalysisCache.cache_key == cache_key)
    )
    cached = res.scalar_one_or_none()
    if cached:
        return row_to_dict(cached)

    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == user["id"]))
    lv = lvr.scalar_one_or_none()
    sr = await session.execute(select(UserStreak).where(UserStreak.user_id == user["id"]))
    streak = sr.scalar_one_or_none()

    streak_days = streak.current_streak if streak and hasattr(streak, "current_streak") else 0
    payload_data = {
        "vitals": row_to_dict(lv) if lv else {},
        "streak_days": streak_days,
        "weather": None,
    }
    briefing = await _llm_quick(
        "Tu es Nora, coach prevention. Reponds en francais, ton encourageant.",
        f"Donne le briefing matinal du patient. Etat: {payload_data}. "
        f"Max 3 phrases impactantes.",
    )
    if not briefing:
        briefing = "Bonjour, votre journee commence. Pensez a hydrater et a bouger 5 minutes."
    payload = {"briefing": briefing, "data": payload_data, "generated_at": utcnow().isoformat()}
    payload_str = json.dumps(payload, ensure_ascii=False)
    stmt = pg_insert(NoraAnalysisCache).values(
        cache_key=cache_key, user_id=user["id"],
        date=_today(), context="morning_briefing",
        analysis=payload_str, created_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[NoraAnalysisCache.cache_key],
        set_={"analysis": payload_str, "created_at": utcnow()},
    )
    await session.execute(stmt)
    await session.commit()
    return {"cache_key": cache_key, "analysis": payload}


@router.post("/nora/checkin-daily")
async def daily_checkin(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Met à jour le streak utilisateur."""
    res = await session.execute(select(UserStreak).where(UserStreak.user_id == user["id"]))
    s = res.scalar_one_or_none()
    today = utcnow().date().isoformat()
    if not s:
        from app.models.misc import UserStreak as _US
        s = _US(user_id=user["id"], current_streak=1, last_checkin=today)
        session.add(s)
    else:
        last = s.last_checkin or ""
        if last != today:
            yesterday = (utcnow().date() - timedelta(days=1)).isoformat()
            s.current_streak = (s.current_streak or 0) + 1 if last == yesterday else 1
            s.last_checkin = today
    await session.commit()
    return {"status": "ok", "streak": s.current_streak}


@router.get("/nora/streak")
async def get_streak(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(UserStreak).where(UserStreak.user_id == user["id"]))
    s = res.scalar_one_or_none()
    return row_to_dict(s) if s else {"current_streak": 0, "last_checkin": None}


@router.get("/nora/predictive-check")
async def predictive_check(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Liste les alertes prédictives actives."""
    res = await session.execute(
        select(PredictiveAlert).where(
            PredictiveAlert.user_id == user["id"],
            (PredictiveAlert.status != "dismissed") | PredictiveAlert.status.is_(None),
        ).order_by(PredictiveAlert.created_at.desc()).limit(20)
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.post("/nora/predictive-alerts/{alert_id}/dismiss")
async def dismiss_predictive_alert(
    alert_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(PredictiveAlert).where(
            PredictiveAlert.id == alert_id, PredictiveAlert.user_id == user["id"]
        )
    )
    a = res.scalar_one_or_none()
    if a:
        a.status = "dismissed"
        await session.commit()
    return {"status": "dismissed"}
