from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid, hashlib, time, json, re

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE
from services.nora_actions import (
    check_weight_goal, update_daily_calories, adjust_macros,
    list_exercise_library, add_exercise,
)

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


# ── Action keywords — detect when Nora should attempt actions ──
_ACTION_KEYWORDS = [
    "calorie", "calories", "kcal", "apport", "nutrition", "macro", "macros",
    "proteine", "glucide", "lipide", "proteines", "glucides", "lipides",
    "exercice", "exercices", "entrainement", "sport", "renforcement",
    "ajoute", "ajouter", "modifie", "modifier", "ajuste", "ajuster",
    "recommande", "propose", "programme", "seance", "workout",
    "manger", "repas", "regime", "alimentation",
]

def _is_action_request(msg: str) -> bool:
    m = msg.lower()
    return sum(1 for kw in _ACTION_KEYWORDS if kw in m) >= 1


def _parse_actions(text: str) -> tuple:
    """Parse action markers from Nora's response. Returns (clean_text, actions_list)."""
    pattern = r'<<<ACTION:(\w+):(.*?)>>>'
    actions = []
    for match in re.finditer(pattern, text, re.DOTALL):
        action_name = match.group(1)
        try:
            params = json.loads(match.group(2).strip())
        except (json.JSONDecodeError, Exception):
            params = {}
        actions.append({"action": action_name, "params": params})
    clean = re.sub(pattern, '', text).strip()
    clean = re.sub(r'\n{3,}', '\n\n', clean)
    return clean, actions


async def _execute_actions(actions: list, uid: str, user: dict) -> list:
    """Execute parsed actions and return results."""
    results = []
    for act in actions:
        name = act["action"]
        params = act["params"]
        try:
            if name == "CHECK_WEIGHT_GOAL":
                r = await check_weight_goal(uid)
                results.append({"action": name, "result": r})
            elif name == "UPDATE_CALORIES":
                r = await update_daily_calories(
                    uid,
                    daily_calories=params.get("daily_calories", 0),
                    macros=params.get("macros"),
                )
                results.append({"action": name, "result": r})
            elif name == "ADJUST_MACROS":
                r = await adjust_macros(
                    uid,
                    proteines_g=params.get("proteines_g"),
                    glucides_g=params.get("glucides_g"),
                    lipides_g=params.get("lipides_g"),
                )
                results.append({"action": name, "result": r})
            elif name == "ADD_EXERCISE":
                r = await add_exercise(uid, user, params)
                results.append({"action": name, "result": r})
            elif name == "LIST_EXERCISES":
                r = await list_exercise_library(uid)
                results.append({"action": name, "result": r})
        except Exception as e:
            print(f"Nora action error ({name}): {e}")
            results.append({"action": name, "result": {"success": False, "message": str(e)}})
    return results


# ── Nora action prompt block ──
NORA_ACTION_INSTRUCTIONS = """
ACTIONS DISPONIBLES (beneficiaire uniquement):
Tu peux effectuer des actions concretes en inserant des marqueurs dans ta reponse. Le systeme les executera automatiquement.

FORMAT: <<<ACTION:NOM_ACTION:{"param":"valeur"}>>>

ACTIONS:
1. CHECK_WEIGHT_GOAL — Verifier si un objectif de poids est en cours
   <<<ACTION:CHECK_WEIGHT_GOAL:{}>>>

2. UPDATE_CALORIES — Modifier l'apport calorique quotidien (INTERDIT si objectif poids actif)
   <<<ACTION:UPDATE_CALORIES:{"daily_calories": 1800, "macros": {"proteines_g": 70, "glucides_g": 220, "lipides_g": 50}}>>>

3. ADJUST_MACROS — Modifier les macronutriments individuellement (INTERDIT si objectif poids actif)
   <<<ACTION:ADJUST_MACROS:{"proteines_g": 75, "glucides_g": 200, "lipides_g": 55}>>>

4. ADD_EXERCISE — Ajouter un exercice au programme du beneficiaire
   Depuis la bibliotheque: <<<ACTION:ADD_EXERCISE:{"template_id": "xxx", "sets": 3, "repetitions": 12, "rest_seconds": 60}>>>
   Personnalise: <<<ACTION:ADD_EXERCISE:{"title": "Marche rapide", "category": "cardio", "sets": 1, "repetitions": 1, "rest_seconds": 0, "description": "30 minutes de marche soutenue", "muscle_group": "jambes"}>>>

5. LIST_EXERCISES — Lister les exercices disponibles dans la bibliotheque
   <<<ACTION:LIST_EXERCISES:{}>>>

REGLES STRICTES POUR LES ACTIONS:
- Tu peux utiliser PLUSIEURS actions dans une seule reponse. Le systeme les executera toutes dans l'ordre
- Pour modifier calories ou macros: emets DIRECTEMENT l'action UPDATE_CALORIES ou ADJUST_MACROS. Le systeme verifie automatiquement s'il y a un objectif de poids et bloquera si necessaire. Tu n'as PAS besoin de faire CHECK_WEIGHT_GOAL avant
- Si le systeme bloque une modification (objectif actif), dis au patient qu'il doit d'abord terminer ou supprimer son objectif de poids dans l'espace Minceur
- Tu peux TOUJOURS ajouter des exercices (avec ou sans objectif de poids)
- Ne SUPPRIME JAMAIS les exercices prescrits par un gardien ou coach
- Plafond 2h d'exercice/jour pour les seniors
- Ajustements progressifs uniquement (pas de changements drastiques)
- Quand tu effectues une action, explique au patient ce que tu fais en langage naturel AVANT le marqueur
"""


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

    # Build health context — for guardian, use specific beneficiary if provided
    is_guardian = role in ('guardian', 'professional')
    beneficiary_id = data.get("beneficiary_id")
    health_ctx = ""
    target_ben_name = ""
    if is_guardian:
        if beneficiary_id:
            # Specific beneficiary selected
            ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0})
            if ben:
                ctx = await build_health_context(user, for_guardian=True, beneficiary_data=ben)
                health_ctx = ctx
                target_ben_name = (ben.get("name") or "").split(" ")[0]
        else:
            # No specific beneficiary — get all
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
                # Extract beneficiary first names for personalized 3rd person speech
                ben_names = []
                for link in (await db.guardian_beneficiaries.find({"guardian_id": uid}, {"_id": 0}).to_list(10)):
                    b = await db.users.find_one({"id": link.get("beneficiary_id")}, {"_id": 0, "name": 1})
                    if b and b.get("name"):
                        ben_names.append(b["name"].split(" ")[0])
                focus_name = target_ben_name or (ben_names[0] if ben_names else "le patient")
                names_str = ", ".join(ben_names) if ben_names else "ses beneficiaires"
                guardian_extra = f"\n- L'utilisateur est un GARDIEN/AIDANT de: {names_str}. Tu reponds actuellement au sujet de {focus_name}. Quand tu parles des beneficiaires, utilise TOUJOURS leur prenom. NE DIS JAMAIS \"vous\" ou \"votre\" pour parler du patient. Tutoie le gardien."
            # Add action instructions for beneficiaries if the message seems action-related
            action_block = ""
            wants_actions = not is_guardian and _is_action_request(user_message)
            if wants_actions:
                # Fetch exercise library summary for context
                lib = await list_exercise_library(uid)
                ex_list = ", ".join(f"{e['title']} (id:{e['id']})" for e in lib.get("exercises", [])[:15])
                ex_ctx = f"\nEXERCICES DISPONIBLES DANS LA BIBLIOTHEQUE: {ex_list}" if ex_list else ""
                # Check current nutrition
                today_str_n = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                daily_cache = await db.minceur_daily_cache.find_one(
                    {"user_id": uid, "date": today_str_n}, {"_id": 0}
                )
                nut_ctx = ""
                if daily_cache and daily_cache.get("recommendations"):
                    recs_n = daily_cache["recommendations"]
                    nut_ctx = f"\nNUTRITION ACTUELLE: {recs_n.get('daily_calories', '?')} kcal/jour, macros: {recs_n.get('macros', {})}"
                action_block = f"\n{NORA_ACTION_INSTRUCTIONS}{ex_ctx}{nut_ctx}"

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
- Privilegier longevite, prevention, bien vieillir{guardian_extra}{action_block}"""

            chat = LlmChat(
                api_key=api_key,
                session_id=f"cx-{uuid.uuid4().hex[:8]}",
                system_message=system
            ).with_model("openai", "gpt-5.2")

            prompt = f"Historique recent:\n{history_str}\n\nNouveau message du {'gardien' if is_guardian else 'patient'}: {user_message}"
            r = await chat.send_message(UserMessage(text=prompt))
            ai_response = r.strip()

            # If not an action-related message, cache it
            if not wants_actions:
                _set_cache(ckey, ai_response)
        except Exception as e:
            print(f"Chat AI error: {e}")

    if not ai_response:
        ai_response = "Je n'ai pas pu traiter votre question. Pourriez-vous reformuler ?"

    # Parse and execute actions from Nora's response
    actions_executed = []
    clean_response = ai_response
    if "<<<ACTION:" in ai_response:
        clean_response, parsed_actions = _parse_actions(ai_response)
        if parsed_actions:
            u_full = await db.users.find_one({"id": uid}, {"_id": 0})
            actions_executed = await _execute_actions(parsed_actions, uid, u_full or user)
            # If an action failed with objectif_poids_actif, inject info into response
            for ar in actions_executed:
                if ar.get("result", {}).get("reason") == "objectif_poids_actif":
                    if "objectif" not in clean_response.lower():
                        clean_response += "\n\nVous avez un objectif de poids en cours. Vous devez d'abord le terminer ou le supprimer dans l'espace Minceur avant que je puisse modifier vos apports caloriques ou macros."

    # Save AI response (clean version without markers)
    resp_id = str(uuid.uuid4())
    await db.chat_messages.insert_one({
        "id": resp_id, "user_id": uid, "session_id": session_id,
        "role": "assistant", "content": clean_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **({"actions": actions_executed} if actions_executed else {}),
    })

    response = {
        "id": resp_id,
        "content": clean_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if actions_executed:
        response["actions"] = actions_executed
    return response


@router.get("/chat/history")
async def get_chat_history(session_id: str = None, user=Depends(get_current_user)):
    """Get chat message history for current role - only today's messages"""
    uid = user['id']
    role = user.get('active_role') or user.get('role', 'beneficiary')
    sid = session_id or f"chat-{uid}-{role}"
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    messages = await db.chat_messages.find(
        {"user_id": uid, "session_id": sid, "created_at": {"$gte": today_start}}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages


@router.delete("/chat/clear")
async def clear_chat(session_id: str = None, user=Depends(get_current_user)):
    """Clear chat history for specific session"""
    uid = user['id']
    role = user.get('active_role') or user.get('role', 'beneficiary')
    sid = session_id or f"chat-{uid}-{role}"
    await db.chat_messages.delete_many({"user_id": uid, "session_id": sid})
    return {"status": "cleared"}
