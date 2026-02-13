import os
import logging
import base64
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', '')

FRENCH_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
FALLBACK_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"

eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY) if ELEVENLABS_API_KEY else None


def generate_speech(text: str, voice_id: str = None) -> bytes:
    if not eleven_client:
        logger.error("ElevenLabs client not configured")
        return b''
    vid = voice_id or FRENCH_VOICE_ID
    try:
        audio_gen = eleven_client.text_to_speech.convert(
            text=text, voice_id=vid, model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.9, style=0.6, use_speaker_boost=True)
        )
        audio_data = b""
        for chunk in audio_gen:
            audio_data += chunk
        return audio_data
    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        if vid != FALLBACK_VOICE_ID:
            return generate_speech(text, FALLBACK_VOICE_ID)
        return b''


def generate_speech_base64(text: str) -> str:
    audio = generate_speech(text)
    if audio:
        return base64.b64encode(audio).decode()
    return ''


MESSAGES = {
    "fall_detected": (
        "Bonjour, ici le plateau d'ecoute Chutex. "
        "Nous avons detecte une chute. "
        "Comment allez-vous ? Dites-moi si vous allez bien, ou si vous avez besoin d'aide."
    ),
    "no_response": (
        "Nous n'avons pas recu de reponse. "
        "Nous alertons vos proches et les secours. "
        "Restez calme, de l'aide arrive."
    ),
    "confirmed_ok": (
        "Merci de votre reponse. Nous sommes rassures que tout va bien. "
        "Si vous avez besoin d'aide plus tard, n'hesitez pas a nous contacter. "
        "Bonne journee et prenez soin de vous."
    ),
    "help_requested": (
        "Nous avons bien compris que vous avez besoin d'aide. "
        "Vos proches sont alertes et nous restons en ligne avec vous. "
        "De l'aide arrive bientot. Restez calme."
    ),
    "inactivity_alert": (
        "Bonjour, ici Chutex. "
        "Nous n'avons detecte aucune activite depuis un moment et nous voulons verifier que tout va bien. "
        "Comment allez-vous ? Dites-moi simplement si tout va bien."
    ),
    "sos_manual": (
        "Bonjour, ici le plateau d'ecoute Chutex. "
        "Nous avons recu votre alerte SOS. "
        "Pouvez-vous me dire comment vous vous sentez ? "
        "Vos proches sont en train d'etre prevenus."
    ),
    "unclear_response": (
        "Pardonnez-moi, je n'ai pas bien compris votre reponse. "
        "Pouvez-vous me dire simplement si vous allez bien, ou si vous avez besoin d'aide ?"
    ),
    "heart_anomaly": (
        "Bonjour, ici Chutex. Nous avons detecte une anomalie dans vos constantes cardiaques. "
        "Comment vous sentez-vous ? Avez-vous des douleurs dans la poitrine ou un essoufflement ? "
        "Dites-moi comment vous allez."
    ),
    "spo2_low": (
        "Bonjour, ici Chutex. Nous avons detecte un niveau d'oxygene dans le sang inferieur a la normale. "
        "Comment vous sentez-vous ? Etes-vous essouffle ou fatigue ? "
        "Dites-moi si tout va bien."
    ),
    "guardian_alert": (
        "Bonjour, ici le plateau d'ecoute Chutex. "
        "Une alerte a ete declenchee pour {beneficiary_name}. "
        "Nous n'avons pas pu confirmer que tout va bien. "
        "Pouvez-vous vous rendre sur place ou ouvrir l'application Chutex pour intervenir ?"
    ),
    "guardian_followup": (
        "Merci d'avoir repondu. Nous comptons sur vous. "
        "Ouvrez l'application Chutex et appuyez sur le bouton Intervenir pour confirmer votre prise en charge. "
        "Merci pour votre reactivite."
    ),
    "emergency_dispatch": (
        "Attention, situation critique. Aucun gardien n'a pu etre joint. "
        "Les intervenants professionnels sont en cours de notification. "
        "Les secours sont alertes."
    ),
}


def get_contextual_message(alert_type: str, beneficiary_name: str = "", medical_context: str = "") -> str:
    if alert_type == 'fall' or 'chute' in alert_type.lower():
        return MESSAGES['fall_detected']
    elif alert_type == 'heart_rate' or 'cardiaque' in alert_type.lower():
        return MESSAGES['heart_anomaly']
    elif alert_type == 'spo2' or 'oxygene' in alert_type.lower():
        return MESSAGES['spo2_low']
    elif alert_type == 'inactivity' or 'inactiv' in alert_type.lower():
        return MESSAGES['inactivity_alert']
    elif alert_type == 'sos':
        return MESSAGES['sos_manual']
    return MESSAGES['fall_detected']


async def get_available_voices():
    if not eleven_client:
        return []
    try:
        response = eleven_client.voices.get_all()
        return [{"id": v.voice_id, "name": v.name, "language": getattr(v, 'language', '')} for v in response.voices[:20]]
    except Exception as e:
        logger.error(f"Error fetching voices: {e}")
        return []
