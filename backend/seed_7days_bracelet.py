"""Seed 7 days of realistic bracelet + scale data for Josette."""
import asyncio
import random
import os
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "chutex_db")


def jitter(base, amplitude):
    return round(base + random.uniform(-amplitude, amplitude), 1)


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    user = await db.users.find_one({"phone": {"$regex": "651245918"}}, {"_id": 0})
    if not user:
        print("Josette not found")
        return
    uid = user["id"]
    print(f"Seeding 7 days of bracelet data for {user['name']} ({uid})")

    # Clear old readings
    await db.device_readings.delete_many({"user_id": uid})
    await db.glycemia_calibrations.delete_many({"user_id": uid})
    await db.glycemia_history.delete_many({"user_id": uid})
    print("Cleared old readings")

    now = datetime.now(timezone.utc)
    readings = []
    glycemia_calibrations = []
    glycemia_history = []

    # Josette's baseline profile (77 ans, femme, legere hypertension)
    BASE_HR_REST = 72
    BASE_HR_ACTIVE = 95
    BASE_HR_SLEEP = 58
    BASE_SPO2 = 97
    BASE_SYSTOLIC = 128
    BASE_DIASTOLIC = 76
    BASE_TEMP = 36.5
    BASE_WEIGHT = 74.5
    BASE_HRV = 32
    BASE_STRESS = 35
    BASE_RECOVERY = 65

    for day_offset in range(7):
        day = now - timedelta(days=day_offset)
        day_date = day.strftime("%Y-%m-%d")
        is_today = (day_offset == 0)

        # Daily variation factors
        activity_factor = random.uniform(0.7, 1.3)
        mood_factor = random.uniform(0.85, 1.15)
        sleep_quality_factor = random.uniform(0.8, 1.1)

        daily_steps = int(random.randint(4200, 8500) * activity_factor)
        daily_calories = int(daily_steps * 0.04 + random.randint(80, 150))
        daily_distance = round(daily_steps * 0.0007 + random.uniform(-0.3, 0.3), 1)

        # ─── READINGS THROUGHOUT THE DAY (every 2-3 hours) ───
        hours_schedule = [1, 3, 6, 8, 10, 12, 14, 16, 18, 20, 22]
        if is_today:
            current_hour = now.hour
            hours_schedule = [h for h in hours_schedule if h <= current_hour]

        for hi, hour in enumerate(hours_schedule):
            ts = day.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            ts_iso = ts.isoformat()

            # Heart rate varies by time of day
            if hour < 6:
                hr = int(jitter(BASE_HR_SLEEP + random.randint(-3, 3), 4))
            elif hour < 9:
                hr = int(jitter(BASE_HR_REST - 2, 5))
            elif hour < 12:
                hr = int(jitter(BASE_HR_REST + 5 * activity_factor, 6))
            elif hour < 14:
                hr = int(jitter(BASE_HR_REST + 3, 5))
            elif hour < 18:
                hr = int(jitter(BASE_HR_ACTIVE * activity_factor * 0.85, 8))
            elif hour < 21:
                hr = int(jitter(BASE_HR_REST + 2, 5))
            else:
                hr = int(jitter(BASE_HR_REST - 3, 4))
            hr = max(52, min(hr, 115))

            spo2 = int(jitter(BASE_SPO2, 1.5))
            spo2 = max(93, min(spo2, 99))

            temp = round(jitter(BASE_TEMP + (0.3 if 14 <= hour <= 18 else -0.2 if hour < 6 else 0), 0.2), 1)
            temp = max(35.8, min(temp, 37.4))

            hrv = int(jitter(BASE_HRV + (8 if hour < 7 else -5 if 10 <= hour <= 16 else 0), 5))
            hrv = max(15, min(hrv, 60))

            stress = int(jitter(BASE_STRESS * mood_factor + (10 if 9 <= hour <= 17 else -8 if hour < 7 else 0), 8))
            stress = max(5, min(stress, 80))

            recovery = int(jitter(BASE_RECOVERY * sleep_quality_factor + (-10 if 14 <= hour <= 17 else 5 if hour < 9 else 0), 7))
            recovery = max(30, min(recovery, 95))

            # Steps accumulate throughout the day
            steps_so_far = int(daily_steps * (hour / 23.0) + random.randint(-200, 200))
            steps_so_far = max(0, min(steps_so_far, daily_steps))

            cal_so_far = int(daily_calories * (hour / 23.0) + random.randint(-20, 20))
            dist_so_far = round(daily_distance * (hour / 23.0), 1)

            # Blood pressure (2-3 readings per day, at morning/afternoon/evening)
            sys_bp = int(jitter(BASE_SYSTOLIC + (5 if 10 <= hour <= 16 else -3 if hour < 8 else 0), 5))
            dia_bp = int(jitter(BASE_DIASTOLIC + (3 if 10 <= hour <= 16 else -2 if hour < 8 else 0), 4))
            sys_bp = max(105, min(sys_bp, 150))
            dia_bp = max(60, min(dia_bp, 92))

            reading = {
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "device_type": "bracelet",
                "device_model": "J2358",
                "timestamp": ts_iso,
                "data": {
                    "heart_rate": hr,
                    "spo2": spo2,
                    "temperature": temp,
                    "systolic": sys_bp,
                    "diastolic": dia_bp,
                    "blood_pressure": {"systolic": sys_bp, "diastolic": dia_bp},
                    "steps": steps_so_far,
                    "calories": cal_so_far,
                    "distance_km": dist_so_far,
                    "hrv": hrv,
                    "stress_level": stress,
                    "recovery_score": recovery,
                    "battery": max(15, 95 - day_offset * 8 - hour),
                }
            }

            # Add sleep data to the early morning reading (summary of the night)
            if hour <= 6:
                sleep_dur = int(random.randint(340, 460) * sleep_quality_factor)
                deep = int(sleep_dur * random.uniform(0.15, 0.25))
                light = int(sleep_dur * random.uniform(0.40, 0.55))
                rem = int(sleep_dur * random.uniform(0.15, 0.22))
                awake = sleep_dur - deep - light - rem
                qual = int(jitter(75 * sleep_quality_factor, 8))
                qual = max(45, min(qual, 95))
                interruptions = random.randint(0, 4)

                reading["data"]["sleep_duration_min"] = sleep_dur
                reading["data"]["deep_sleep_min"] = deep
                reading["data"]["light_sleep_min"] = light
                reading["data"]["rem_sleep_min"] = rem
                reading["data"]["sleep_quality"] = qual
                reading["data"]["sleep_interruptions"] = interruptions
                reading["data"]["sleep"] = {
                    "sleep_duration": sleep_dur,
                    "sleep_quality": qual,
                    "deep_minutes": deep,
                    "light_minutes": light,
                    "rem_minutes": rem,
                    "awake_minutes": max(0, awake),
                    "sleep_interruptions": interruptions,
                    "bedtime": f"{22 + random.randint(0,1)}:{random.randint(0,59):02d}",
                    "wakeup": f"{6 + random.randint(0,1)}:{random.randint(0,45):02d}",
                }

            readings.append(reading)

        # ─── DAILY SUMMARY READING (end of day or latest for today) ───
        summary_hour = now.hour if is_today else 23
        summary_ts = day.replace(hour=summary_hour, minute=30, second=0).isoformat()

        # Generate heart rate history array (24 entries, one per hour)
        hr_history = []
        for h in range(24 if not is_today else now.hour + 1):
            if h < 6:
                hv = int(jitter(BASE_HR_SLEEP, 4))
            elif h < 9:
                hv = int(jitter(BASE_HR_REST, 5))
            elif h < 12:
                hv = int(jitter(BASE_HR_REST + 8 * activity_factor, 6))
            elif h < 14:
                hv = int(jitter(BASE_HR_REST + 4, 5))
            elif h < 18:
                hv = int(jitter(BASE_HR_ACTIVE * activity_factor * 0.8, 8))
            elif h < 21:
                hv = int(jitter(BASE_HR_REST, 5))
            else:
                hv = int(jitter(BASE_HR_REST - 4, 4))
            hr_history.append(max(50, min(hv, 120)))

        summary_reading = {
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "device_type": "bracelet",
            "device_model": "J2358",
            "timestamp": summary_ts,
            "data": {
                "heart_rate": hr_history[-1] if hr_history else BASE_HR_REST,
                "heart_rate_history": hr_history,
                "spo2": int(jitter(BASE_SPO2, 1)),
                "temperature": round(jitter(BASE_TEMP, 0.15), 1),
                "systolic": int(jitter(BASE_SYSTOLIC, 4)),
                "diastolic": int(jitter(BASE_DIASTOLIC, 3)),
                "blood_pressure": {
                    "systolic": int(jitter(BASE_SYSTOLIC, 4)),
                    "diastolic": int(jitter(BASE_DIASTOLIC, 3)),
                },
                "steps": daily_steps,
                "calories": daily_calories,
                "distance_km": daily_distance,
                "hrv": int(jitter(BASE_HRV, 5)),
                "stress_level": int(jitter(BASE_STRESS * mood_factor, 8)),
                "recovery_score": int(jitter(BASE_RECOVERY * sleep_quality_factor, 7)),
                "battery": max(15, 95 - day_offset * 10),
                "sleep_duration_min": int(random.randint(340, 460) * sleep_quality_factor),
                "sleep_quality": int(jitter(75 * sleep_quality_factor, 8)),
                "deep_sleep_min": random.randint(55, 110),
                "light_sleep_min": random.randint(130, 200),
                "rem_sleep_min": random.randint(45, 90),
                "sleep_interruptions": random.randint(0, 3),
                "sleep": {
                    "sleep_duration": int(random.randint(340, 460) * sleep_quality_factor),
                    "sleep_quality": int(jitter(75 * sleep_quality_factor, 8)),
                    "deep_minutes": random.randint(55, 110),
                    "light_minutes": random.randint(130, 200),
                    "rem_minutes": random.randint(45, 90),
                    "awake_minutes": random.randint(5, 25),
                    "sleep_interruptions": random.randint(0, 3),
                },
            }
        }
        readings.append(summary_reading)

        # ─── SCALE READING (once per morning) ───
        weight_var = day_offset * 0.05  # slight daily variation
        weight = round(BASE_WEIGHT + random.uniform(-0.8, 0.8) - weight_var, 1)
        bmi = round(weight / (1.75 ** 2), 1)
        body_fat = round(random.uniform(28.0, 33.0), 1)
        muscle = round(random.uniform(32.0, 36.0), 1)
        water = round(random.uniform(48.0, 54.0), 1)
        bone = round(random.uniform(2.3, 2.8), 1)
        visceral = random.randint(8, 12)
        bmr = random.randint(1280, 1400)

        scale_ts = day.replace(hour=7, minute=random.randint(15, 45), second=0).isoformat()
        readings.append({
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "device_type": "scale",
            "device_model": "Chutex Scale",
            "timestamp": scale_ts,
            "data": {
                "weight": weight,
                "bmi": bmi,
                "body_fat_pct": body_fat,
                "muscle_pct": muscle,
                "water_pct": water,
                "bone_mass": bone,
                "visceral_fat": visceral,
                "bmr": bmr,
                "health_evaluation": random.choice(["Bonne", "Correcte", "Bonne", "Bonne"]),
                "battery": random.randint(70, 100),
            }
        })

        # ─── GLYCEMIA CALIBRATIONS (1-2 per day, realistic for 77yo woman) ───
        for gc in range(random.randint(1, 2)):
            gc_hour = random.choice([8, 12, 14, 19]) + gc
            gc_ts = day.replace(hour=gc_hour, minute=random.randint(0, 59)).isoformat()
            # Josette: glycemia typically 0.85-1.15 g/L (normal to slight pre-diabetic)
            glyc_val = round(random.uniform(0.82, 1.18), 2)
            glycemia_calibrations.append({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "glycemia_value": glyc_val,
                "unit": "g/L",
                "context": random.choice(["a_jeun", "post_repas", "avant_repas", "post_repas"]),
                "timestamp": gc_ts,
                "created_at": gc_ts,
            })
            # Also add to glycemia_history
            zone = "normale" if glyc_val <= 1.0 else "vigilance" if glyc_val <= 1.26 else "elevee"
            glycemia_history.append({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "estimated_glycemia": glyc_val,
                "zone": zone,
                "confidence": random.randint(65, 88),
                "timestamp": gc_ts,
                "date": day_date,
                "source": "calibration",
            })

    # Insert all readings
    if readings:
        await db.device_readings.insert_many(readings)
        print(f"Inserted {len(readings)} device readings ({len([r for r in readings if r['device_type'] == 'bracelet'])} bracelet, {len([r for r in readings if r['device_type'] == 'scale'])} scale)")

    if glycemia_calibrations:
        await db.glycemia_calibrations.insert_many(glycemia_calibrations)
        print(f"Inserted {len(glycemia_calibrations)} glycemia calibrations")

    if glycemia_history:
        await db.glycemia_history.insert_many(glycemia_history)
        print(f"Inserted {len(glycemia_history)} glycemia history entries")

    # Ensure devices are registered and connected
    for dtype, model in [("bracelet", "J2358"), ("scale", "Chutex Scale")]:
        existing = await db.devices.find_one({"user_id": uid, "device_type": dtype})
        if not existing:
            await db.devices.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "device_type": dtype,
                "device_model": model,
                "name": f"Bracelet Elio" if dtype == "bracelet" else "Balance Chutex",
                "connected": True,
                "paired": True,
                "battery": 78 if dtype == "bracelet" else 85,
                "last_sync": now.isoformat(),
                "created_at": now.isoformat(),
            })
        else:
            await db.devices.update_one(
                {"user_id": uid, "device_type": dtype},
                {"$set": {"connected": True, "paired": True, "battery": 78 if dtype == "bracelet" else 85, "last_sync": now.isoformat()}}
            )
    print("Devices marked as connected + paired")

    # Update user weight
    await db.users.update_one({"id": uid}, {"$set": {"weight_kg": BASE_WEIGHT, "height_cm": 175}})

    # Ensure subscription active
    sub = await db.subscriptions.find_one({"beneficiary_id": uid})
    if not sub:
        await db.subscriptions.insert_one({
            "id": str(uuid.uuid4()),
            "beneficiary_id": uid,
            "beneficiary_phone": user.get("phone", ""),
            "subscription_type": "care",
            "status": "active",
            "source": "seed",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        })
        await db.users.update_one({"id": uid}, {"$set": {"has_subscription": True, "subscription_type": "care"}})
        print("Created Care subscription")

    # Seed ECG history
    await db.ecg_records.delete_many({"user_id": uid})
    ecg_records = []
    for i in range(5):
        ts = (now - timedelta(days=i + 1, hours=random.randint(8, 14))).isoformat()
        ecg_records.append({
            "user_id": uid,
            "id": f"ecg-{uid}-{i}",
            "timestamp": ts,
            "result": random.choice(["Rythme sinusal normal", "Rythme sinusal", "Rythme regulier"]),
            "bpm": random.randint(65, 78),
            "normal": True,
            "duration_sec": 30,
        })
    if ecg_records:
        await db.ecg_records.insert_many(ecg_records)
        print(f"Inserted {len(ecg_records)} ECG records")

    total = len(readings)
    print(f"\nSeed complete! {total} total readings over 7 days")
    print(f"  - ~{total // 7} readings/day")
    print(f"  - Bracelet: HR, SpO2, BP, Temp, Steps, Calories, Distance, HRV, Stress, Recovery, Sleep")
    print(f"  - Scale: Weight, BMI, Body Fat, Muscle, Water, Bone, Visceral, BMR")
    print(f"  - Glycemia: {len(glycemia_calibrations)} calibrations, {len(glycemia_history)} history")
    print(f"  - ECG: {len(ecg_records)} records")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
