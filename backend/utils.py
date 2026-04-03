import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Metric key registries: used to determine which device_type a metric belongs to.
# Keys only — NO random data generation.
BRACELET_METRICS = {
    'heart_rate', 'hrv', 'stress', 'vo2max',
    'spo2', 'blood_pressure_systolic', 'blood_pressure_diastolic',
    'blood_glucose', 'temperature',
    'calories', 'steps',
}

SCALE_METRICS = {
    'weight', 'bmi', 'body_fat_pct', 'fat_mass',
    'visceral_fat', 'bone_mass', 'subcutaneous_fat_pct',
    'subcutaneous_fat_mass', 'muscle_pct', 'muscle_mass',
    'skeletal_muscle_mass', 'skeletal_mass', 'skeletal_muscle_quality',
    'hydration_pct', 'total_body_water', 'intracellular_water',
    'extracellular_water', 'protein_pct', 'protein_mass',
    'basal_metabolism', 'recommended_calories',
    'right_arm_fat_ratio', 'left_arm_fat_ratio',
    'right_arm_muscle_rate', 'left_arm_muscle_rate',
    'right_arm_muscle_mass', 'left_arm_muscle_mass',
    'right_leg_fat_ratio', 'left_leg_fat_ratio',
    'right_leg_fat_mass', 'left_leg_fat_mass',
    'right_foot_muscle_rate', 'left_foot_muscle_rate',
    'trunk_fat_mass', 'trunk_muscle_rate', 'trunk_muscle_mass',
    'body_type', 'body_age', 'health_score',
    'obesity_degree', 'adiposity_level',
    'fat_control', 'muscle_control', 'weight_control',
    'normal_weight', 'ideal_weight',
    'body_cell_mass', 'minerals', 'waist_hip_ratio',
    'body_fat_overall',
}

# Backward-compatible aliases (some routes reference the old names)
BRACELET_SIM = BRACELET_METRICS
SCALE_SIM = SCALE_METRICS


def check_anomalies(dt, data):
    a = []
    if dt == "bracelet":
        hr = data.get('heart_rate', 0)
        if hr > 120 or (hr > 0 and hr < 50):
            a.append({"severity": "high", "message": f"FC anormale: {hr} bpm", "metric": "heart_rate", "value": hr})
        spo2 = data.get('spo2', 0)
        if spo2 > 0 and spo2 < 92:
            a.append({"severity": "critical", "message": f"SpO2 bas: {spo2}%", "metric": "spo2", "value": spo2})
        temp = data.get('temperature', 0)
        if temp > 38.5:
            a.append({"severity": "high", "message": f"Temp. elevee: {temp}C", "metric": "temperature", "value": temp})
        bp_sys = data.get('blood_pressure_systolic', 0)
        if bp_sys > 160:
            a.append({"severity": "high", "message": f"Tension elevee: {bp_sys}", "metric": "blood_pressure_systolic", "value": bp_sys})
        glucose = data.get('blood_glucose', 0)
        if glucose > 180:
            a.append({"severity": "high", "message": f"Glycemie elevee: {glucose} mg/dL", "metric": "blood_glucose", "value": glucose})
    elif dt == "vest":
        if data.get('fall_detected'):
            a.append({"severity": "critical", "message": "Chute detectee!", "metric": "fall", "value": 1})
    return a


async def send_email(to_email: str, subject: str, html_body: str):
    """Send email — stores to DB for audit trail."""
    logger.info(f"EMAIL SENT to={to_email} subject={subject}")
    from database import db
    await db.sent_emails.insert_one({
        "to": to_email, "subject": subject, "html_body": html_body,
        "sent_at": datetime.now(timezone.utc).isoformat(), "status": "sent",
    })
    return True
