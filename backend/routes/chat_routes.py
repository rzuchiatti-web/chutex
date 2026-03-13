from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid, hashlib, time

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

router = APIRouter()

# ── Response cache ──
_response_cache: dict = {}  # key -> {"response": str, "ts": float}
CACHE_TTL_STATIC = 3600    # 1h for app/service questions
CACHE_TTL_HEALTH = 300     # 5min for health data questions

_STATIC_KEYWORDS = [
    "abonnement", "prix", "tarif", "cout", "combien", "formule",
    "bracelet", "elio", "balance", "vita", "gilet",
    "hebergement", "donnees", "hds", "securite", "rgpd", "serveur",
    "programme", "prevention", "chute", "sommeil", "tension", "dorsi",
    "teleassistance", "care", "sos", "urgence",
    "nora", "qui es-tu", "qui tu es", "comment fonctionne",
    "espace gardien", "gardien", "aidant",
    "minceur", "calories", "poids"
]

def _is_static_question(msg: str) -> bool:
    m = msg.lower()
    return sum(1 for kw in _STATIC_KEYWORDS if kw in m) >= 2

def _cache_key(uid: str, msg: str, is_guardian: bool) -> str:
    normalized = msg.lower().strip()
    return hashlib.md5(f"{uid}:{is_guardian}:{normalized}".encode()).hexdigest()

def _get_cached(key: str, ttl: int):
    entry = _response_cache.get(key)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["response"]
    return None

def _set_cache(key: str, response: str):
    _response_cache[key] = {"response": response, "ts": time.time()}
    # Evict old entries if cache gets too large
    if len(_response_cache) > 500:
        cutoff = time.time() - CACHE_TTL_STATIC
        keys_to_del = [k for k, v in _response_cache.items() if v["ts"] < cutoff]
        for k in keys_to_del:
            del _response_cache[k]


async def build_health_context(user, for_guardian=False, beneficiary_data=None):
    """Build a rich health context string for the AI from user data"""
    target = beneficiary_data or user
    uid = target['id']
    parts = []

    # User profile
    parts.append(f"Patient: {target.get('name', 'Inconnu')}, {target.get('gender', '')}, ne(e) le {target.get('date_of_birth', 'inconnu')}.")
    if target.get('height_cm'): parts.append(f"Taille: {target['height_cm']}cm.")
    if target.get('weight_kg'): parts.append(f"Poids: {target['weight_kg']}kg.")
    if target.get('address'): parts.append(f"Adresse: {target['address']}.")

    # Medical record
    if target.get('blood_type'): parts.append(f"Groupe sanguin: {target['blood_type']}.")
    if target.get('medical_conditions'): parts.append(f"Pathologies: {target['medical_conditions']}.")
    if target.get('allergies'): parts.append(f"Allergies: {target['allergies']}.")
    if target.get('pacemaker'): parts.append(f"Pacemaker: {target['pacemaker']}.")
    if target.get('stents'): parts.append(f"Stents: {target['stents']}.")
    if target.get('thyroid'): parts.append(f"Thyroide: {target['thyroid']}.")
    if target.get('other_condition'): parts.append(f"Autre: {target['other_condition']}.")
    if target.get('surgeries'): parts.append(f"Chirurgies: {target['surgeries']}.")
    if target.get('doctor_name'): parts.append(f"Medecin traitant: {target['doctor_name']}.")
    if target.get('emergency_contact_name'): parts.append(f"Contact urgence: {target['emergency_contact_name']} ({target.get('emergency_contact_phone', '')}).")

    # Latest device data
    dash = await db.dashboard_summary.find_one({"user_id": uid}, {"_id": 0})
    if dash:
        br = dash.get('bracelet', {})
        sc = dash.get('scale', {})
        if br:
            parts.append(f"Bracelet: FC {br.get('heart_rate')}bpm, SpO2 {br.get('spo2')}%, Tension {br.get('blood_pressure',{}).get('systolic','?')}/{br.get('blood_pressure',{}).get('diastolic','?')}, Temp {br.get('temperature')}C, Pas {br.get('steps')}, Calories {br.get('calories')}kcal.")
        if sc:
            parts.append(f"Balance: Poids {sc.get('weight')}kg, IMC {sc.get('bmi')}, Graisse {sc.get('body_fat')}%, Muscle {sc.get('muscle_mass')}%, Eau {sc.get('water_pct')}%, Age metab {sc.get('metabolic_age')} ans.")

    # Latest health summary
    summary = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})
    if summary:
        parts.append(f"Score sante: {summary.get('score', '?')}/100 ({summary.get('status', '?')}). Resume: {summary.get('summary', '')}. Recommandation: {summary.get('recommendation', '')}.")

    # Active program
    enrollment = await db.program_enrollments.find_one(
        {"user_id": uid, "status": "active"}, {"_id": 0}
    )
    if enrollment:
        program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
        if program:
            day = enrollment.get("current_day", 1)
            parts.append(f"Programme actif: '{program.get('title', '')}' - Jour {day}/{program.get('duration_days', 21)}.")
            last_checkin = await db.program_checkins.find_one(
                {"enrollment_id": enrollment["id"]}, {"_id": 0}, sort=[("date", -1)]
            )
            if last_checkin:
                parts.append(f"Dernier check-in: humeur {last_checkin.get('mood', '?')}/5, note: {last_checkin.get('note', 'aucune')}.")

    # Recent alerts
    alerts = await db.alerts.find(
        {"user_id": uid, "status": {"$in": ["active", "acknowledged"]}}, {"_id": 0}
    ).sort("created_at", -1).to_list(3)
    if alerts:
        parts.append(f"Alertes recentes: {', '.join(a.get('message', '') for a in alerts)}.")

    if for_guardian:
        parts.append(f"[CONTEXTE: L'utilisateur actuel est un gardien/aidant de {target.get('name', 'ce patient')}. Reponds aux questions du gardien sur la sante de son beneficiaire.]")

    return " ".join(parts)


@router.post("/chat/message")
async def send_chat_message(data: dict, user=Depends(get_current_user)):
    """Send a message to the AI health coach and get a personalized response"""
    user_message = data.get("message", "").strip()
    if not user_message:
        return {"error": "Message vide"}

    uid = user['id']
    role = user.get('active_role') or user.get('role', 'beneficiary')
    session_id = data.get("session_id", f"chat-{uid}-{role}")
    user_lang = data.get("lang", "FR").upper()
    lang_names = {"FR": "francais", "EN": "English", "DE": "Deutsch", "ES": "espanol", "IT": "italiano", "PT": "portugues", "NL": "Nederlands"}
    lang_name = lang_names.get(user_lang, "francais")

    # Save user message
    msg_id = str(uuid.uuid4())
    await db.chat_messages.insert_one({
        "id": msg_id, "user_id": uid, "session_id": session_id,
        "role": "user", "content": user_message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Build health context — for guardian, include beneficiary data
    is_guardian = role == 'guardian'
    health_ctx = ""
    if is_guardian:
        # Get guardian's beneficiaries
        ben_links = await db.guardian_beneficiaries.find({"guardian_id": uid}, {"_id": 0}).to_list(10)
        ben_contexts = []
        for link in ben_links:
            ben = await db.users.find_one({"id": link.get("beneficiary_id")}, {"_id": 0})
            if ben:
                ctx = await build_health_context(user, for_guardian=True, beneficiary_data=ben)
                ben_contexts.append(ctx)
        health_ctx = "\n---\n".join(ben_contexts) if ben_contexts else "Aucun beneficiaire rattache."

        # Add guardian-specific context (interventions, prescriptions, etc.)
        interventions = await db.interventions.find({"guardian_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        if interventions:
            iv_summary = ", ".join(f"{iv.get('status','?')} pour {iv.get('beneficiary_name','?')}" for iv in interventions)
            health_ctx += f"\nInterventions recentes du gardien: {iv_summary}."

        alerts = await db.alerts.find({"status": {"$in": ["active", "acknowledged"]}}, {"_id": 0}).sort("created_at", -1).to_list(5)
        if alerts:
            alert_summary = ", ".join(f"{a.get('message','')} ({a.get('beneficiary_name','')})" for a in alerts)
            health_ctx += f"\nAlertes en cours: {alert_summary}."
    else:
        # Use the enriched Nora context for beneficiaries
        nora_ctx = await build_nora_context(user)
        health_ctx = format_nora_context_for_prompt(nora_ctx)

    # Get recent chat history for context (last 10 messages from today only)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    recent = await db.chat_messages.find(
        {"user_id": uid, "session_id": session_id, "created_at": {"$gte": today_start}}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    recent.reverse()
    history_str = "\n".join(f"{'Patient' if m['role'] == 'user' else 'Coach'}: {m['content']}" for m in recent[-8:])

    # Call LLM
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    ai_response = ""

    # Check cache first
    is_static = _is_static_question(user_message)
    ckey = _cache_key(uid, user_message, is_guardian)
    ttl = CACHE_TTL_STATIC if is_static else CACHE_TTL_HEALTH
    cached = _get_cached(ckey, ttl)
    if cached:
        ai_response = cached
    elif api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            guardian_extra = ""
            if is_guardian:
                guardian_extra = "\n- L'utilisateur est un GARDIEN/AIDANT. Reponds sur la sante de ses beneficiaires. Aide-le sur l'espace gardien (interventions, alertes, suivi temps reel). Tutoie-le."
            system = f"""Tu es Nora, IA de Chutex specialisee en prevention et longevite. Reponds en {lang_name}, ton serieux et factuel, max 3-4 phrases sauf question complexe. L'app s'appelle Chutex (JAMAIS "CareWatch"). Chutex Care = service teleassistance 24/7.

DONNEES SANTE:
{health_ctx}

{APP_SERVICES_KNOWLEDGE}

REGLES:
- Base-toi EXCLUSIVEMENT sur les donnees reelles ci-dessus
- Si donnees absentes/vides/0 : dis clairement qu'aucune donnee n'est disponible, propose de connecter Elio ou Balance Vita. NE FABRIQUE JAMAIS de donnees
- Recommandations concretes et medicalement pertinentes uniquement avec donnees reelles
- Si +75 ans sans Care → recommande teleassistance. Si anomalie sommeil → programme sommeil. Si tension elevee → programme tension. Si faible activite → programme activite
- Symptomes graves → consultation medicale en presentiel
- Pas d'emojis, pas de felicitations superficielles, pas de bonjour si conversation deja en cours
- Privilegier longevite, prevention, bien vieillir{guardian_extra}"""

            chat = LlmChat(
                api_key=api_key,
                session_id=f"cx-{uuid.uuid4().hex[:8]}",
                system_message=system
            ).with_model("openai", "gpt-5.2")

            prompt = f"Historique recent:\n{history_str}\n\nNouveau message du {'gardien' if is_guardian else 'patient'}: {user_message}"
            r = await chat.send_message(UserMessage(text=prompt))
            ai_response = r.strip()
            # Cache the response
            _set_cache(ckey, ai_response)
        except Exception as e:
            print(f"Chat AI error: {e}")

    if not ai_response:
        ai_response = "Je n'ai pas pu traiter votre question. Pourriez-vous reformuler ?"

    # Save AI response
    resp_id = str(uuid.uuid4())
    await db.chat_messages.insert_one({
        "id": resp_id, "user_id": uid, "session_id": session_id,
        "role": "assistant", "content": ai_response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "id": resp_id,
        "content": ai_response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/chat/history")
async def get_chat_history(user=Depends(get_current_user)):
    """Get chat message history for current role - only today's messages"""
    uid = user['id']
    role = user.get('active_role') or user.get('role', 'beneficiary')
    session_id = f"chat-{uid}-{role}"
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    messages = await db.chat_messages.find(
        {"user_id": uid, "session_id": session_id, "created_at": {"$gte": today_start}}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages


@router.delete("/chat/clear")
async def clear_chat(user=Depends(get_current_user)):
    """Clear chat history for current role"""
    uid = user['id']
    role = user.get('active_role') or user.get('role', 'beneficiary')
    session_id = f"chat-{uid}-{role}"
    await db.chat_messages.delete_many({"user_id": uid, "session_id": session_id})
    return {"status": "cleared"}
