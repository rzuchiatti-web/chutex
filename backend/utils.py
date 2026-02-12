import random, logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

BRACELET_SIM = {
    'heart_rate': (62, 95), 'hrv': (25, 80), 'stress': (15, 65), 'vo2max': (22, 48),
    'spo2': (95, 99), 'blood_pressure_systolic': (115, 138), 'blood_pressure_diastolic': (72, 88),
    'blood_glucose': (78, 125), 'temperature': (36.2, 37.3),
    'calories': (800, 2200), 'steps': (1500, 9000),
}


def generate_sleep_hypnogram():
    """Generate realistic sleep data matching bracelet 2208A format (minute by minute)"""
    # 7-8 hours of sleep = 420-480 minutes
    total_minutes = random.randint(390, 480)
    stages = []
    # Sleep architecture: fall asleep -> cycles of (light -> deep -> light -> REM)
    # Each cycle ~90 min, 4-5 cycles per night
    minute = 0
    # Fall asleep phase (5-20 min of light sleep with some wakefulness)
    fall_asleep = random.randint(5, 20)
    for _ in range(fall_asleep):
        stages.append(random.choice([2, 2, 2, 0]))  # mostly light, some awake
        minute += 1

    cycles = random.randint(4, 5)
    for cycle in range(cycles):
        if minute >= total_minutes:
            break
        # Light sleep (15-25 min)
        for _ in range(random.randint(15, 25)):
            if minute >= total_minutes: break
            stages.append(2)
            minute += 1
        # Deep sleep (more in early cycles, less later)
        deep_dur = random.randint(15, 30) if cycle < 2 else random.randint(5, 15)
        for _ in range(deep_dur):
            if minute >= total_minutes: break
            stages.append(1)
            minute += 1
        # Light sleep transition (5-10 min)
        for _ in range(random.randint(5, 10)):
            if minute >= total_minutes: break
            stages.append(2)
            minute += 1
        # REM (longer in later cycles)
        rem_dur = random.randint(5, 15) if cycle < 2 else random.randint(15, 30)
        for _ in range(rem_dur):
            if minute >= total_minutes: break
            stages.append(3)
            minute += 1
        # Brief awakening between cycles (0-3 min)
        for _ in range(random.randint(0, 3)):
            if minute >= total_minutes: break
            stages.append(0)
            minute += 1

    deep = stages.count(1)
    light = stages.count(2)
    rem = stages.count(3)
    awake = stages.count(0)
    total = len(stages)
    quality = min(100, int((deep * 2 + rem * 1.5 + light * 0.8) / total * 100)) if total > 0 else 0

    return {
        "stages": stages,  # minute-by-minute: 0=awake, 1=deep, 2=light, 3=REM
        "total_minutes": total,
        "deep_minutes": deep,
        "light_minutes": light,
        "rem_minutes": rem,
        "awake_minutes": awake,
        "sleep_quality": quality,
        "cycles": cycles,
        "sleep_duration": round(total / 60, 1),
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
