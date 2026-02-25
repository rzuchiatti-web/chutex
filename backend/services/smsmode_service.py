"""
SMS Mode integration for CARE WATCH alert notifications
API docs: https://dev.smsmode.com/sms/v1/
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

SMSMODE_API_KEY = os.environ.get("SMSMODE_API_KEY", "")
SMSMODE_URL = "https://rest.smsmode.com/sms/v1/messages"


async def send_sms(phone: str, text: str) -> bool:
    """Send SMS via SMS Mode API. Phone must be in format 33612345678 (no +)."""
    if not SMSMODE_API_KEY:
        logger.warning("SMS Mode API key not configured")
        return False

    # Normalize phone: remove + and spaces
    cleaned = phone.replace("+", "").replace(" ", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "33" + cleaned[1:]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                SMSMODE_URL,
                headers={
                    "X-Api-Key": SMSMODE_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "recipient": {"to": cleaned},
                    "body": {"text": text},
                },
            )
        if r.status_code in (200, 201):
            logger.info(f"SMS sent to {cleaned}: {text[:50]}...")
            return True
        else:
            logger.error(f"SMS Mode error {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return False


async def send_alert_sms(phone: str, beneficiary_name: str, alert_type: str, alert_id: str) -> bool:
    """Send alert notification SMS to a guardian."""
    type_labels = {
        "manual_app": "Bouton SOS (application)",
        "manual_bracelet": "Pression manuelle (bracelet)",
        "health_anomaly": "Anomalie de sante detectee",
        "fall": "Chute detectee (gilet)",
        "sos": "Alerte SOS",
    }
    label = type_labels.get(alert_type, alert_type)
    text = f"CHUTEX ALERTE - {label} pour {beneficiary_name}. Ouvrez l'app Chutex pour plus de details. Ref: {alert_id[:8]}"
    return await send_sms(phone, text)


async def send_invitation_sms(phone: str, subscriber_name: str) -> bool:
    """Send guardian invitation SMS after Chutex Care subscription."""
    text = f"{subscriber_name} vous a designe comme gardien sur Chutex. Telechargez l'app et inscrivez-vous en tant que gardien pour suivre son etat de sante."
    return await send_sms(phone, text)
