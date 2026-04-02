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
    sex: 0=female, 1=male
    Returns dict with all body metrics or empty dict on failure
    """
    token = await get_lefu_token()
    if not token:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "weightKg": weight_kg,
                "impedance": int(impedance),
                "height": int(height_cm),
                "age": int(age),
                "sex": int(sex),
            }
            logger.info(f"Lefu body data request: {payload}")
            resp = await client.get(
                f"{LEFU_BASE_URL}/openapi-bodydata/bodyData/getAcLfBodyData",
                params=payload,
                headers={
                    "token": token,
                },
                timeout=10
            )
            data = resp.json()
            if data.get("code") in (0, 200) and data.get("data"):
                body = data["data"]
                # Parse lefuBodyData array format
                lefu_items = body.get("lefuBodyData", [])
                parsed = {}
                for item in lefu_items:
                    key = item.get("bodyParamKey", "")
                    val = item.get("currentValue", 0)
                    if key and val is not None:
                        parsed[key] = val
                # Also support old flat format
                if not parsed:
                    parsed = body
                logger.info(f"Lefu body data parsed: {list(parsed.keys())}")
                # Capture ALL metrics dynamically (Lefu returns up to 58 metrics)
                result = {
                    "weight": weight_kg,
                    "bmi": parsed.get("ppBMI", 0),
                    "body_fat_pct": parsed.get("ppFat", parsed.get("ppBodyfatPercentage", 0)),
                    "muscle_mass": parsed.get("ppMuscleKg", 0),
                    "bone_mass": parsed.get("ppBoneKg", 0),
                    "hydration_pct": parsed.get("ppWaterPercentage", 0),
                    "visceral_fat": parsed.get("ppVisceralFat", parsed.get("ppVFAL", 0)),
                    "basal_metabolism": parsed.get("ppBMR", 0),
                    "body_age": parsed.get("ppBodyAge", 0),
                    "protein_pct": parsed.get("ppProteinPercentage", 0),
                    "health_score": parsed.get("ppBodyScore", 0),
                    "subcutaneous_fat": parsed.get("ppBodySubcutaneousFat", parsed.get("ppVFPercentage", 0)),
                    "lean_body_mass": parsed.get("ppBodyLBM", parsed.get("ppLoseFatWeightKg", 0)),
                    "muscle_rate": parsed.get("ppMusclePercentage", 0),
                    "fat_free_weight": parsed.get("ppFatFreeWeight", parsed.get("ppLoseFatWeightKg", 0)),
                    "body_type": parsed.get("ppBodyType", 0),
                    "ideal_weight": parsed.get("ppIdealWeightKg", 0),
                    "obesity_level": parsed.get("ppObesityLevel", 0),
                    # Extended metrics (segmental, skeletal, etc.)
                    "skeletal_muscle_kg": parsed.get("ppBodySkeletal", parsed.get("ppSkeletalMuscleMassKg", 0)),
                    "skeletal_muscle_pct": parsed.get("ppBodySkeletalPercentage", parsed.get("ppSkeletalMusclePercentage", 0)),
                    "fat_control_kg": parsed.get("ppFatControlKg", 0),
                    "muscle_control_kg": parsed.get("ppMuscleControlKg", 0),
                    "fat_kg": parsed.get("ppFatKg", parsed.get("ppBodyFatKg", 0)),
                    "standard_weight": parsed.get("ppStandardWeight", 0),
                    "weight_control_kg": parsed.get("ppWeightControlKg", parsed.get("ppControlWeightKg", 0)),
                    "body_shape": parsed.get("ppBodyShape", 0),
                    "heart_rate": parsed.get("ppHeartRate", 0),
                    # Segmental analysis (8-electrode)
                    "right_arm_fat_pct": parsed.get("ppRightArmFatPercentage", 0),
                    "left_arm_fat_pct": parsed.get("ppLeftArmFatPercentage", 0),
                    "trunk_fat_pct": parsed.get("ppTrunkFatPercentage", 0),
                    "right_leg_fat_pct": parsed.get("ppRightLegFatPercentage", 0),
                    "left_leg_fat_pct": parsed.get("ppLeftLegFatPercentage", 0),
                    "right_arm_muscle_kg": parsed.get("ppRightArmMuscleKg", 0),
                    "left_arm_muscle_kg": parsed.get("ppLeftArmMuscleKg", 0),
                    "trunk_muscle_kg": parsed.get("ppTrunkMuscleKg", 0),
                    "right_leg_muscle_kg": parsed.get("ppRightLegMuscleKg", 0),
                    "left_leg_muscle_kg": parsed.get("ppLeftLegMuscleKg", 0),
                    "right_arm_fat_kg": parsed.get("ppRightArmFatKg", 0),
                    "left_arm_fat_kg": parsed.get("ppLeftArmFatKg", 0),
                    "trunk_fat_kg": parsed.get("ppTrunkFatKg", 0),
                    "right_leg_fat_kg": parsed.get("ppRightLegFatKg", 0),
                    "left_leg_fat_kg": parsed.get("ppLeftLegFatKg", 0),
                    # Store ALL raw keys for future use
                    "all_lefu_metrics": parsed,
                    "raw_lefu_response": body,
                }
                # Remove zero values from segmental to keep clean
                return {k: v for k, v in result.items() if v or k in ("weight", "all_lefu_metrics", "raw_lefu_response")}
            else:
                logger.error(f"Lefu body data error: {data}")
                return {}
    except Exception as e:
        logger.error(f"Lefu body data request failed: {e}")
        return {}
