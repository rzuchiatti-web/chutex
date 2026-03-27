"""
Chutex Care — Unified Nora AI Analysis Router
Consolidates all lazy-loaded LLM analysis endpoints into a single intelligent router.
"""
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone
import os, uuid

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt

router = APIRouter()

COLLECTION = "nora_analysis_cache"


async def _get_user_health_data(uid: str):
    """Fetch user profile + device data for prompt building."""
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        return None, {}, {}, None, 0
    br_doc = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    sc_doc = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    br = br_doc.get("data", {}) if br_doc else {}
    sc = sc_doc.get("data", {}) if sc_doc else {}
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
    age = 0
    if u.get("date_of_birth"):
        try:
            from dateutil.parser import parse as dparse
            age = (datetime.now(timezone.utc) - dparse(u["date_of_birth"]).replace(tzinfo=timezone.utc)).days // 365
        except Exception:
            pass
    return u, br, sc, goal, age


def _build_prompt(context: str, u: dict, br: dict, sc: dict, goal, age: int) -> tuple[str, str]:
    """Build (system_message, prompt) tuple per context type."""
    name = u.get("name", "")
    gender = u.get("gender", "")
    height = u.get("height_cm", 170)
    weight = sc.get("weight") or u.get("weight_kg", 0)
    bmi = round(weight / ((height / 100) ** 2), 1) if weight and height else 0
    conditions = u.get("medical_conditions", "Aucune")
    allergies = u.get("allergies", "Aucune")

    sys_msg = "Tu es Nora, assistante sante. Reponds en texte brut uniquement. Pas d'emoji. Francais."

    profile_block = f"PROFIL: {name}, {age} ans, {gender}, {height}cm, {weight}kg\nCONDITIONS: {conditions}\nALLERGIES: {allergies}"

    vitals_block = f"""DONNEES VITALES:
- Pouls: {br.get('heart_rate', '--')} bpm
- SpO2: {br.get('spo2', '--')}%
- Tension: {br.get('blood_pressure_systolic', '--')}/{br.get('blood_pressure_diastolic', '--')} mmHg
- Temperature: {br.get('temperature', '--')}C
- Poids: {weight}kg | IMC: {bmi}
- Masse grasse: {sc.get('body_fat_pct', '--')}% | Masse musculaire: {sc.get('muscle_pct', '--')}%"""

    prompts = {
        "health": (
            sys_msg,
            f"""Tu es Nora, assistante sante bienveillante. Fais une analyse de sante globale pour ce patient.

{profile_block}

{vitals_block}
{f"OBJECTIF POIDS: {goal['target_kg']}kg en {goal.get('weeks', 0)} semaines" if goal else ""}

Redige une analyse en 4-5 phrases courtes et bienveillantes. Commente l'etat cardiaque, le poids, les constantes, et donne un conseil. Pas d'emoji. Francais."""
        ),
        "aging": (
            "Tu es Nora, specialiste longevite. Reponds en texte brut. Pas d'emoji. Francais.",
            f"""Tu es Nora, assistante sante specialisee en longevite. Analyse l'age biologique et le rythme de vieillissement de ce patient.

{profile_block}

DONNEES:
- Age reel: {age} ans
- Pouls: {br.get('heart_rate', '--')} bpm | SpO2: {br.get('spo2', '--')}%
- Tension: {br.get('blood_pressure_systolic', '--')}/{br.get('blood_pressure_diastolic', '--')} mmHg
- Masse grasse: {sc.get('body_fat_pct', '--')}% | Masse musculaire: {sc.get('muscle_pct', '--')}%
- IMC: {bmi}

Redige une analyse en 4-5 phrases courtes. Commente les facteurs protecteurs et les risques. Donne un conseil concret pour ralentir le vieillissement. Pas d'emoji. Francais."""
        ),
        "activity": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse l'activite physique: {br.get('steps', '--')} pas, {br.get('calories', '--')} kcal brulees, {br.get('distance_km', '--')} km, stress {br.get('stress_level', '--')}, recuperation {br.get('recovery_score', '--')}. Donne des conseils d'activite adaptes a un senior de {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "sleep": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse le sommeil: qualite {br.get('sleep_quality', '--')}/100, duree {br.get('sleep_hours', '--')}h, phases profondes {br.get('deep_sleep_pct', '--')}%, phases legeres {br.get('light_sleep_pct', '--')}%, REM {br.get('rem_sleep_pct', '--')}%. Conseils pour ameliorer le sommeil a {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "glycemia": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse la glycemie: derniere mesure {br.get('glucose', '--')} mg/dL, HbA1c estimee {br.get('hba1c', '--')}%. Conditions: {conditions}. Conseils nutritionnels pour un senior de {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "heart_rate": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse le rythme cardiaque: {br.get('heart_rate', '--')} bpm au repos, variabilite {br.get('hrv', '--')}ms. Antecedents: {conditions}. Interpretation et conseils pour {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "spo2": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse la saturation en oxygene: SpO2 {br.get('spo2', '--')}%. Contexte: {conditions}. Interpretation et quand consulter pour un patient de {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "blood_pressure": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse la tension: {br.get('blood_pressure_systolic', '--')}/{br.get('blood_pressure_diastolic', '--')} mmHg. Conditions: {conditions}. Interpretation, risques et conseils pour {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
        "temperature": (
            sys_msg,
            f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Analyse la temperature: {br.get('temperature', '--')}C. Contexte medical: {conditions}. Interpretation pour un patient de {age} ans. Redige 4-5 phrases courtes et bienveillantes. Pas d'emoji. Francais."
        ),
    }
    if context in prompts:
        return prompts[context]
    # Fallback to a general analysis
    return (sys_msg, f"Tu es Nora, assistante sante. Profil: {name}, {age} ans, {gender}, {weight}kg. Fais une analyse generale de sante. Redige 4-5 phrases courtes. Pas d'emoji. Francais.")


@router.get("/nora/analysis")
async def get_nora_analysis(context: str = Query("health"), user=Depends(get_current_user)):
    """Unified Nora analysis endpoint. Context: health, aging, minceur, activity, sleep, glycemia, heart_rate, spo2, blood_pressure, temperature."""
    uid = user["id"]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"{uid}_{context}_{today_str}"

    # Check cache
    cached = await db[COLLECTION].find_one({"cache_key": cache_key}, {"_id": 0})
    if cached and cached.get("analysis"):
        return {"analysis": cached["analysis"], "cached": True, "context": context}

    # Minceur is special — uses the daily recommendation cache
    if context == "minceur":
        return await _minceur_analysis(uid, today_str, cache_key, user)

    # All other contexts
    u, br, sc, goal, age = await _get_user_health_data(uid)
    if not u:
        return {"analysis": "", "cached": False, "context": context}

    sys_msg, prompt = _build_prompt(context, u, br, sc, goal, age)

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return {"analysis": "", "cached": False, "context": context}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm = LlmChat(
            api_key=api_key,
            session_id=f"nora-{context}-{uid[:8]}-{today_str}",
            system_message=sys_msg
        ).with_model("openai", "gpt-5.2")
        resp = await llm.send_message(UserMessage(text=prompt))
        analysis = resp.strip()

        # Cache result
        await db[COLLECTION].update_one(
            {"cache_key": cache_key},
            {"$set": {
                "cache_key": cache_key,
                "user_id": uid,
                "context": context,
                "date": today_str,
                "analysis": analysis,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        return {"analysis": analysis, "cached": False, "context": context}
    except Exception as e:
        print(f"Nora analysis error ({context}): {e}")
        return {"analysis": "", "cached": False, "context": context}


async def _minceur_analysis(uid: str, today_str: str, cache_key: str, user: dict):
    """Handle minceur context by checking daily recommendation cache first."""
    cached_daily = await db.minceur_daily_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )
    if cached_daily and cached_daily.get("recommendations", {}).get("nora_insight"):
        analysis = cached_daily["recommendations"]["nora_insight"]
        tip = cached_daily["recommendations"].get("tip_of_the_day", "")
        full = f"{analysis} {tip}".strip() if tip else analysis
        return {"analysis": full, "cached": True, "context": "minceur"}

    # Try generating via minceur pipeline
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        return {"analysis": "", "cached": False, "context": "minceur"}
    latest = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    latest_data = latest.get("data", {}) if latest else {}
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})

    from routes.minceur_routes import generate_daily_recommendations
    recs = await generate_daily_recommendations(uid, u, latest_data, goal)
    if recs and recs.get("nora_insight"):
        analysis = recs["nora_insight"]
        tip = recs.get("tip_of_the_day", "")
        full = f"{analysis} {tip}".strip() if tip else analysis
        return {"analysis": full, "cached": False, "context": "minceur"}
    return {"analysis": "", "cached": False, "context": "minceur"}


@router.get("/nora/analysis-history")
async def get_nora_analysis_history(limit: int = 20, user=Depends(get_current_user)):
    """Return all cached Nora analyses for the user, most recent first."""
    uid = user["id"]
    analyses = await db[COLLECTION].find(
        {"user_id": uid, "analysis": {"$ne": ""}},
        {"_id": 0, "cache_key": 0}
    ).sort("created_at", -1).to_list(limit)

    # Also check legacy caches
    legacy_caches = [
        ("nora_health_analysis_cache", "health"),
        ("nora_aging_analysis_cache", "aging"),
        ("nora_page_analysis_cache", None),
    ]
    seen_keys = {f"{a['user_id']}_{a['context']}_{a['date']}" for a in analyses}

    for coll_name, fixed_ctx in legacy_caches:
        try:
            legacy = await db[coll_name].find(
                {"user_id": uid, "analysis": {"$ne": ""}},
                {"_id": 0, "cache_key": 0}
            ).sort("created_at", -1).to_list(limit)
            for item in legacy:
                ctx = fixed_ctx or item.get("context", "general")
                key = f"{uid}_{ctx}_{item.get('date', '')}"
                if key not in seen_keys:
                    analyses.append({
                        "user_id": uid,
                        "context": ctx,
                        "date": item.get("date", ""),
                        "analysis": item.get("analysis", ""),
                        "created_at": item.get("created_at", ""),
                    })
                    seen_keys.add(key)
        except Exception:
            pass

    # Sort all by created_at descending
    analyses.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return analyses[:limit]


# ═══════════════════════════════════════════
# BACKWARD COMPATIBILITY WRAPPERS
# Keep old endpoints working during transition
# ═══════════════════════════════════════════

@router.get("/nora/health-analysis")
async def get_nora_health_analysis_compat(user=Depends(get_current_user)):
    return await get_nora_analysis(context="health", user=user)


@router.get("/nora/aging-analysis")
async def get_nora_aging_analysis_compat(user=Depends(get_current_user)):
    return await get_nora_analysis(context="aging", user=user)


@router.get("/nora/page-analysis")
async def get_nora_page_analysis_compat(context: str = "general", user=Depends(get_current_user)):
    return await get_nora_analysis(context=context, user=user)


@router.get("/nora/minceur-analysis")
async def get_nora_minceur_analysis_compat(user=Depends(get_current_user)):
    return await get_nora_analysis(context="minceur", user=user)
