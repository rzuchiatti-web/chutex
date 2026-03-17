"""Seed simulated health data for the beneficiary test account."""
import asyncio
import random
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "chutex_db")

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Find the beneficiary (Josette Zuchiatti)
    user = await db.users.find_one({"phone": {"$regex": "651245918"}}, {"_id": 0})
    if not user:
        print("Beneficiary not found")
        return
    uid = user["id"]
    print(f"Seeding health data for {user['name']} ({uid})")

    # Clear old readings
    await db.device_readings.delete_many({"user_id": uid})
    print("Cleared old device readings")

    now = datetime.now(timezone.utc)
    readings = []

    # Generate 14 days of bracelet readings
    for day_offset in range(14):
        ts = (now - timedelta(days=day_offset, hours=random.randint(0, 4))).isoformat()
        hr = random.randint(62, 85)
        spo2 = random.randint(95, 99)
        sys_bp = random.randint(115, 135)
        dia_bp = random.randint(68, 82)
        temp = round(random.uniform(36.2, 36.9), 1)
        steps = random.randint(3500, 9000)
        calories = random.randint(180, 420)
        distance = round(random.uniform(1.5, 6.0), 1)
        sleep_dur = random.randint(320, 480)
        deep_sleep = random.randint(60, 120)
        light_sleep = random.randint(120, 200)
        rem_sleep = random.randint(40, 100)
        sleep_qual = random.randint(60, 92)
        hrv = random.randint(25, 55)
        recovery = random.randint(50, 90)
        stress = random.randint(15, 55)

        readings.append({
            "user_id": uid,
            "device_type": "bracelet",
            "timestamp": ts,
            "data": {
                "heart_rate": hr,
                "spo2": spo2,
                "systolic": sys_bp,
                "diastolic": dia_bp,
                "blood_pressure": {"systolic": sys_bp, "diastolic": dia_bp},
                "temperature": temp,
                "steps": steps,
                "calories": calories,
                "distance_km": distance,
                "sleep_duration_min": sleep_dur,
                "deep_sleep_min": deep_sleep,
                "light_sleep_min": light_sleep,
                "rem_sleep_min": rem_sleep,
                "sleep_quality": sleep_qual,
                "sleep_interruptions": random.randint(0, 3),
                "hrv": hrv,
                "recovery_score": recovery,
                "stress_level": stress,
                "battery": random.randint(40, 95),
                "sleep": {
                    "sleep_duration": sleep_dur,
                    "sleep_quality": sleep_qual,
                    "deep_minutes": deep_sleep,
                    "light_minutes": light_sleep,
                    "rem_minutes": rem_sleep,
                    "awake_minutes": random.randint(5, 20),
                    "sleep_interruptions": random.randint(0, 3),
                },
            }
        })

    # Generate 14 days of scale readings
    base_weight = random.uniform(68.0, 76.0)
    for day_offset in range(14):
        ts = (now - timedelta(days=day_offset, hours=random.randint(6, 10))).isoformat()
        weight = round(base_weight + random.uniform(-0.5, 0.5), 1)
        bmi = round(weight / (1.75 ** 2), 1)
        body_fat = round(random.uniform(18.0, 28.0), 1)
        muscle = round(random.uniform(35.0, 45.0), 1)
        water = round(random.uniform(50.0, 60.0), 1)
        bone = round(random.uniform(2.5, 3.5), 1)
        visceral = random.randint(6, 12)
        bmr = random.randint(1350, 1650)

        readings.append({
            "user_id": uid,
            "device_type": "scale",
            "timestamp": ts,
            "data": {
                "weight": weight,
                "bmi": bmi,
                "body_fat_pct": body_fat,
                "muscle_pct": muscle,
                "water_pct": water,
                "bone_mass": bone,
                "visceral_fat": visceral,
                "bmr": bmr,
                "health_evaluation": random.choice(["Bonne", "Correcte", "Bonne"]),
                "battery": random.randint(60, 100),
            }
        })

    if readings:
        await db.device_readings.insert_many(readings)
        print(f"Inserted {len(readings)} device readings (bracelet + scale)")

    # Mark devices as connected + paired
    await db.devices.update_many(
        {"user_id": uid, "device_type": "bracelet"},
        {"$set": {"connected": True, "paired": True, "battery": 78, "last_sync": now.isoformat()}}
    )
    await db.devices.update_many(
        {"user_id": uid, "device_type": "scale"},
        {"$set": {"connected": True, "paired": True, "battery": 85, "last_sync": now.isoformat()}}
    )
    print("Marked bracelet and scale as connected + paired")

    # Ensure user has subscription
    sub = await db.subscriptions.find_one({"beneficiary_id": uid})
    if not sub:
        import uuid
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
    else:
        print("Subscription already exists")

    # Seed ECG history
    await db.ecg_records.delete_many({"user_id": uid})
    ecg_records = []
    for i in range(5):
        ts = (now - timedelta(days=i * 3 + 1)).isoformat()
        ecg_records.append({
            "user_id": uid,
            "id": f"ecg-{uid}-{i}",
            "timestamp": ts,
            "result": random.choice(["Rythme sinusal normal", "Rythme sinusal", "Rythme regulier"]),
            "bpm": random.randint(62, 80),
            "normal": True,
            "duration_sec": 30,
        })
    if ecg_records:
        await db.ecg_records.insert_many(ecg_records)
        print(f"Inserted {len(ecg_records)} ECG records")

    print("Health data seeding complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
