import os
import logging
import base64
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', '')

# French voice - "Alice" clear, professional, works great with multilingual French
FRENCH_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"  # Alice - Clear, Engaging
FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah - Mature, Reassuring

eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY) if ELEVENLABS_API_KEY else None


def generate_speech(text: str, voice_id: str = None) -> bytes:
    """Generate speech audio from text using ElevenLabs"""
    if not eleven_client:
        logger.error("ElevenLabs client not configured")
        return b''

    vid = voice_id or FRENCH_VOICE_ID
    try:
        audio_gen = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=vid,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(
                stability=0.7,
                similarity_boost=0.8,
                style=0.3,
                use_speaker_boost=True,
            )
        )
        audio_data = b""
        for chunk in audio_gen:
            audio_data += chunk
        return audio_data
    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        # Try fallback voice
        if vid != FALLBACK_VOICE_ID:
            return generate_speech(text, FALLBACK_VOICE_ID)
        return b''


def generate_speech_base64(text: str) -> str:
    """Generate speech and return as base64 string"""
    audio = generate_speech(text)
    if audio:
        return base64.b64encode(audio).decode()
    return ''


# Pre-defined messages for the AI listening platform
MESSAGES = {
    "fall_detected": (
        "Bonjour, ici le plateau d'ecoute Chutex. "
        "Nous avons detecte une chute. "
        "Comment allez-vous ? "
        "Si vous allez bien, appuyez sur la touche 1. "
        "Si vous avez besoin d'aide, appuyez sur la touche 2 ou ne raccrochez pas."
    ),
    "no_response": (
        "Nous n'avons pas recu de reponse. "
        "Nous alertons vos proches et les secours. "
        "Restez calme, de l'aide arrive."
    ),
    "confirmed_ok": (
        "Merci de votre reponse. Nous sommes rassures. "
        "Si vous avez besoin d'aide plus tard, n'hesitez pas a nous contacter. "
        "Bonne journee."
    ),
    "help_requested": (
        "Nous avons bien recu votre demande d'aide. "
        "Vos proches sont alertes et nous restons en ligne avec vous. "
        "De l'aide arrive bientot."
    ),
    "inactivity_alert": (
        "Bonjour, ici Chutex. "
        "Nous n'avons detecte aucune activite depuis un moment. "
        "Comment allez-vous ? "
        "Appuyez sur 1 si tout va bien, ou sur 2 si vous avez besoin d'aide."
    ),
    "sos_manual": (
        "Bonjour, ici le plateau d'ecoute Chutex. "
        "Nous avons recu votre alerte SOS. "
        "Vos proches sont prevenus. "
        "Restez calme, quelqu'un arrive bientot."
    ),
}


async def get_available_voices():
    """Get list of available ElevenLabs voices"""
    if not eleven_client:
        return []
    try:
        response = eleven_client.voices.get_all()
        return [{"id": v.voice_id, "name": v.name, "language": getattr(v, 'language', '')} for v in response.voices[:20]]
    except Exception as e:
        logger.error(f"Error fetching voices: {e}")
        return []
