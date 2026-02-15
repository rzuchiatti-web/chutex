"""
Lefu Smart Scale API Integration Service
Connects to Lefu Open Platform to calculate body composition metrics
"""
import os
import httpx
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

LEFU_BASE_URL = "https://uniquehealth.lefuenergy.com"
LEFU_APP_KEY = os.environ.get("LEFU_APP_KEY", "")
LEFU_APP_SECRET = os.environ.get("LEFU_APP_SECRET", "")

_cached_token = None
_token_expire = 0


async def get_lefu_token() -> str:
    global _cached_token, _token_expire
    now = int(datetime.now(timezone.utc).timestamp())
    if _cached_token and _token_expire > now + 60:
        return _cached_token

    if not LEFU_APP_KEY or not LEFU_APP_SECRET:
        logger.error("LEFU_APP_KEY or LEFU_APP_SECRET not configured")
        return ""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{LEFU_BASE_URL}/openapi/user/refreshToken",
                json={"appKey": LEFU_APP_KEY, "appSecret": LEFU_APP_SECRET},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            data = resp.json()
            if data.get("code") in (0, 200) and data.get("data", {}).get("token"):
                _cached_token = data["data"]["token"]
                _token_expire = data["data"].get("expireTime", now + 3600)
                logger.info("Lefu token refreshed successfully")
                return _cached_token
            else:
                logger.error(f"Lefu token error: {data}")
                return ""
    except Exception as e:
        logger.error(f"Lefu token request failed: {e}")
        return ""


async def calculate_body_data(weight_kg: float, impedance: int, height_cm: float, age: int, sex: int) -> dict:
    """
    Call Lefu AC Four-Electrode Algorithm API to calculate body composition
    sex: 1=male, 2=female
    Returns dict with all body metrics or empty dict on failure
    """
    token = await get_lefu_token()
    if not token:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{LEFU_BASE_URL}/openapi-bodydata/bodyData/getAcLfBodyData",
                params={
                    "weight": weight_kg,
                    "impedance": impedance,
                    "heightCm": height_cm,
                    "age": age,
                    "sex": sex,
                },
                headers={
                    "Content-Type": "application/json",
                    "token": token,
                },
                timeout=10
            )
            data = resp.json()
            if data.get("code") == 0 and data.get("data"):
                body = data["data"]
                return {
                    "weight": weight_kg,
                    "bmi": body.get("ppBMI", 0),
                    "body_fat_pct": body.get("ppFat", 0),
                    "muscle_mass": body.get("ppMuscleKg", 0),
                    "bone_mass": body.get("ppBoneKg", 0),
                    "hydration_pct": body.get("ppWaterPercentage", 0),
                    "visceral_fat": body.get("ppVisceralFat", 0),
                    "basal_metabolism": body.get("ppBMR", 0),
                    "body_age": body.get("ppBodyAge", 0),
                    "protein_pct": body.get("ppProteinPercentage", 0),
                    "health_score": body.get("ppBodyScore", 0),
                    "subcutaneous_fat": body.get("ppBodySubcutaneousFat", 0),
                    "lean_body_mass": body.get("ppBodyLBM", 0),
                    "muscle_rate": body.get("ppMusclePercentage", 0),
                    "fat_free_weight": body.get("ppFatFreeWeight", 0),
                    "body_type": body.get("ppBodyType", 0),
                    "ideal_weight": body.get("ppIdealWeightKg", 0),
                    "obesity_level": body.get("ppObesityLevel", 0),
                    "raw_lefu_response": body,
                }
            else:
                logger.error(f"Lefu body data error: {data}")
                return {}
    except Exception as e:
        logger.error(f"Lefu body data request failed: {e}")
        return {}
