from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid

from database import db
from auth import get_current_user

router = APIRouter()


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
    session_id = data.get("session_id", f"chat-{uid}")

    # Save user message
    msg_id = str(uuid.uuid4())
    await db.chat_messages.insert_one({
        "id": msg_id, "user_id": uid, "session_id": session_id,
        "role": "user", "content": user_message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Build health context
    health_ctx = await build_health_context(user)

    # Get recent chat history for context (last 10 messages)
    recent = await db.chat_messages.find(
        {"user_id": uid, "session_id": session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    recent.reverse()
    history_str = "\n".join(f"{'Patient' if m['role'] == 'user' else 'Coach'}: {m['content']}" for m in recent[-8:])

    # Call LLM
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    ai_response = ""
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            system = f"""Tu es Nora, l'assistante medicale IA de Chutex Care Watch. Tu es un professionnel de sante rigoureux et factuel. Tu vouvoies le patient. Ton nom est Nora — quand on te demande qui tu es, tu reponds que tu es Nora, l'assistante medicale IA personnelle du patient.

DONNEES SANTE DU PATIENT:
{health_ctx}

REGLES STRICTES:
- Reponds toujours en francais, de facon claire, precise et medicalement fondee (max 3-4 phrases sauf si la question necessite plus de detail)
- Base tes reponses exclusivement sur les DONNEES REELLES du patient ci-dessus
- Donne des recommandations CONCRETES, ACTIONNABLES et MEDICALEMENT PERTINENTES
- Si le patient mentionne des symptomes graves ou inquietants, recommande fermement une consultation medicale en presentiel
- NE JAMAIS utiliser d'emojis
- NE JAMAIS etre excessivement encourageant ou feliciter de maniere superficielle
- Adopte un ton professionnel, serieux et bienveillant sans etre complaisant. Comme un medecin traitant qui connait bien son patient.
- Si les donnees sont insuffisantes, indique-le clairement et explique quelles mesures supplementaires seraient utiles
- Privilegie les explications medicales vulgarisees mais rigoureuses
- IMPORTANT: Ne dis PAS bonjour si l'historique montre que la conversation est deja en cours. Lis l'historique et reponds directement a la question."""

            chat = LlmChat(
                api_key=api_key,
                session_id=f"cx-{uuid.uuid4().hex[:8]}",
                system_message=system
            ).with_model("openai", "gpt-4.1-mini")

            prompt = f"Historique recent:\n{history_str}\n\nNouveau message du patient: {user_message}"
            r = await chat.send_message(UserMessage(text=prompt))
            ai_response = r.strip()
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
    """Get chat message history"""
    uid = user['id']
    session_id = f"chat-{uid}"
    messages = await db.chat_messages.find(
        {"user_id": uid, "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages


@router.delete("/chat/clear")
async def clear_chat(user=Depends(get_current_user)):
    """Clear chat history"""
    uid = user['id']
    await db.chat_messages.delete_many({"user_id": uid})
    return {"status": "cleared"}
