import random, logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

BRACELET_SIM = {
    'heart_rate': (62, 95), 'hrv': (25, 80), 'stress': (15, 65), 'vo2max': (22, 48),
    'spo2': (95, 99), 'blood_pressure_systolic': (115, 138), 'blood_pressure_diastolic': (72, 88),
    'blood_glucose': (78, 125), 'sleep_duration': (5.5, 8.5), 'sleep_quality': (55, 95),
    'sleep_cycles': (3, 6), 'sleep_interruptions': (0, 4), 'temperature': (36.2, 37.3),
    'calories': (800, 2200), 'steps': (1500, 9000),
}

SCALE_SIM = {
    'weight': (58, 88), 'bmi': (19, 28), 'body_fat_pct': (15, 32), 'fat_mass': (8, 22),
    'visceral_fat': (3, 14), 'bone_mass': (2.2, 3.8), 'subcutaneous_fat_pct': (12, 28),
    'subcutaneous_fat_mass': (6, 18), 'muscle_pct': (28, 48), 'muscle_mass': (22, 42),
    'skeletal_muscle_mass': (18, 38), 'skeletal_mass': (2.5, 4.5), 'skeletal_muscle_quality': (55, 95),
    'hydration_pct': (48, 62), 'total_body_water': (30, 48), 'intracellular_water': (18, 28),
    'extracellular_water': (12, 20), 'protein_pct': (14, 20), 'protein_mass': (8, 14),
    'basal_metabolism': (1200, 2000), 'recommended_calories': (1600, 2400),
    'right_arm_fat_ratio': (12, 28), 'left_arm_fat_ratio': (12, 28),
    'right_arm_muscle_rate': (28, 42), 'left_arm_muscle_rate': (28, 42),
    'right_arm_muscle_mass': (1.8, 3.5), 'left_arm_muscle_mass': (1.8, 3.5),
    'right_leg_fat_ratio': (18, 32), 'left_leg_fat_ratio': (18, 32),
    'right_leg_fat_mass': (2.5, 7), 'left_leg_fat_mass': (2.5, 7),
    'right_foot_muscle_rate': (32, 48), 'left_foot_muscle_rate': (32, 48),
    'trunk_fat_mass': (4, 10), 'trunk_muscle_rate': (28, 42), 'trunk_muscle_mass': (12, 22),
    'body_type': (1, 9), 'body_age': (35, 70), 'health_score': (55, 95),
    'obesity_degree': (5, 25), 'adiposity_level': (1, 5),
    'fat_control': (-5, 3), 'muscle_control': (0, 8), 'weight_control': (-8, 5),
    'normal_weight': (55, 78), 'ideal_weight': (55, 72),
    'body_cell_mass': (22, 38), 'minerals': (2.8, 4.2), 'waist_hip_ratio': (0.72, 0.92),
    'body_fat_overall': (15, 32),
}


def gen_data(sim, custom=None):
    if custom:
        return custom
    d = {}
    for k, (lo, hi) in sim.items():
        d[k] = random.randint(lo, hi) if isinstance(lo, int) and isinstance(hi, int) else round(random.uniform(lo, hi), 1)
    return d


def generate_bracelet_data(c=None):
    return gen_data(BRACELET_SIM, c)


def generate_scale_data(c=None):
    return gen_data(SCALE_SIM, c)


def generate_vest_data():
    return {"connected": True, "battery": random.randint(20, 100), "fall_detected": False}


def check_anomalies(dt, data):
    a = []
    if dt == "bracelet":
        hr = data.get('heart_rate', 75)
        if hr > 120 or hr < 50:
            a.append({"severity": "high", "message": f"FC anormale: {hr} bpm"})
        if data.get('spo2', 97) < 92:
            a.append({"severity": "critical", "message": f"SpO2 bas: {data['spo2']}%"})
        if data.get('temperature', 37) > 38.5:
            a.append({"severity": "high", "message": f"Temp. elevee: {data['temperature']}C"})
        if data.get('blood_pressure_systolic', 120) > 160:
            a.append({"severity": "high", "message": f"Tension elevee: {data['blood_pressure_systolic']}"})
        if data.get('blood_glucose', 100) > 180:
            a.append({"severity": "high", "message": f"Glycemie elevee: {data['blood_glucose']} mg/dL"})
    elif dt == "vest":
        if data.get('fall_detected'):
            a.append({"severity": "critical", "message": "Chute detectee!"})
    return a


async def send_email(to_email: str, subject: str, html_body: str):
    """Mock email sending - logs to console"""
    logger.info(f"EMAIL SENT to={to_email} subject={subject}")
    from database import db
    await db.sent_emails.insert_one({
        "to": to_email, "subject": subject, "html_body": html_body,
        "sent_at": datetime.now(timezone.utc).isoformat(), "status": "sent",
    })
    return True
