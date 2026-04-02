from datetime import datetime, timezone
from datetime import timedelta
import math
from fastapi import APIRouter, Depends
from database import db
from auth import get_current_user

router = APIRouter()

@router.get("/health/sleep")
async def get_sleep_data(user=Depends(get_current_user)):
    uid = user['id']
    real_sleep = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.cmd": 0x53, "data.sleep_stages": {"$exists": True, "$ne": []}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    if real_sleep:
        stages = []
        for r in reversed(real_sleep):
            stages.extend(r['data'].get('sleep_stages', []))
        if stages:
            normalized = [1 if s == 1 else 2 if s == 2 else 3 if s == 3 else 0 for s in stages]
            deep = normalized.count(1)
            light = normalized.count(2)
            rem = normalized.count(3)
            awake = normalized.count(0)
            total = len(normalized)
            quality = min(100, int((deep * 2 + rem * 1.5 + light * 0.8) / max(total, 1) * 100))
            return {"stages": normalized, "total_minutes": total, "deep_minutes": deep, "light_minutes": light, "rem_minutes": rem, "awake_minutes": awake, "sleep_quality": quality, "cycles": max(1, deep // 15), "sleep_duration": round(total / 60, 1), "date": real_sleep[0]['timestamp'], "source": "bracelet"}
    latest = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet", "data.sleep_duration_min": {"$gt": 0}},
        {"_id": 0}, sort=[("timestamp", -1)]
    )
    if latest and latest.get("data", {}).get("sleep_duration_min", 0) > 0:
        dd = latest["data"]
        deep = dd.get("deep_sleep_min", 0)
        light = dd.get("light_sleep_min", 0)
        rem = dd.get("rem_sleep_min", 0)
        total = dd.get("sleep_duration_min", 0)
        quality = dd.get("sleep_quality", 0)
        inter = dd.get("sleep_interruptions", 0)
        stages = []
        cycles = max(1, round(total / 90))
        for c in range(cycles):
            for _ in range(max(1, light // cycles)): stages.append(2)
            for _ in range(max(1, deep // cycles)): stages.append(1)
            for _ in range(max(1, rem // cycles)): stages.append(3)
            if c < cycles - 1 and inter > 0: stages.append(0)
        return {"stages": stages, "total_minutes": total, "deep_minutes": deep, "light_minutes": light, "rem_minutes": rem, "awake_minutes": inter, "sleep_quality": quality, "cycles": cycles, "sleep_duration": round(total / 60, 1), "date": latest.get("timestamp", ""), "source": "device"}
    return {"stages": [], "total_minutes": 0, "deep_minutes": 0, "light_minutes": 0, "rem_minutes": 0, "awake_minutes": 0, "sleep_quality": 0, "cycles": 0, "sleep_duration": 0, "date": datetime.now(timezone.utc).isoformat(), "source": "none"}


@router.get("/health/sleep/history")
async def get_sleep_history(user=Depends(get_current_user)):
    uid = user['id']
    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.sleep_duration_min": {"$gt": 0}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(14)
    history = []
    seen_dates = set()
    for r in readings:
        dd = r.get("data", {})
        dt = r.get("timestamp", "")[:10]
        if dt in seen_dates:
            continue
        seen_dates.add(dt)
        deep = dd.get("deep_sleep_min", 0)
        light = dd.get("light_sleep_min", 0)
        rem = dd.get("rem_sleep_min", 0)
        total = dd.get("sleep_duration_min", 0)
        quality = dd.get("sleep_quality", 0)
        inter = dd.get("sleep_interruptions", 0)
        history.append({
            "date": dt, "duration": round(total / 60, 1),
            "deep": deep, "light": light, "rem": rem, "awake": inter,
            "quality": quality, "cycles": max(1, round(total / 90))
        })
    return sorted(history, key=lambda h: h.get("date", ""))[-7:]


@router.get("/health/sleep/analysis")
async def get_sleep_analysis(user=Depends(get_current_user)):
    """WHOOP-inspired sleep analysis computed from the same data as /health/sleep."""
    sleep_data = await get_sleep_data(user)
    sleep_history_data = await get_sleep_history(user)

    total_min = sleep_data.get("total_minutes", 0)
    quality = sleep_data.get("sleep_quality", 0)
    deep = sleep_data.get("deep_minutes", 0)
    light = sleep_data.get("light_minutes", 0)
    rem = sleep_data.get("rem_minutes", 0)
    awake = sleep_data.get("awake_minutes", 0)

    empty_response = {
        "has_data": False, "performance_score": 0,
        "sufficiency": {"score": 0, "actual_min": 0, "need_min": 480, "pct": 0},
        "consistency": {"score": 0, "detail": "Pas assez de donnees"},
        "efficiency": {"score": 0, "pct": 0},
        "sleep_stress": {"score": 0, "level": "inconnu"},
        "debt": {"total_min": 0, "days": []},
        "recovery": {"score": 0, "zone": "grey", "hrv": 0, "rhr": 0},
        "stages_avg": {"deep_pct": 0, "light_pct": 0, "rem_pct": 0, "awake_pct": 0},
        "sleep_need_min": 480, "recommended_bedtime": "22:30", "weekly_trend": [],
    }

    if total_min <= 0:
        return empty_response

    # Get latest vitals
    uid = user['id']
    latest_vitals = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    vitals = latest_vitals.get("data", {}) if latest_vitals else {}
    steps = vitals.get("steps", 0) or 0
    hrv_val = vitals.get("hrv", 0) or 0
    rhr_val = vitals.get("resting_heart_rate", vitals.get("heart_rate", 0)) or 0
    stress_val = vitals.get("stress_level", 0) or 0

    # Sleep Need
    base_need = 480
    strain_bonus = min(60, int(steps / 1000) * 5)
    sleep_need = base_need + strain_bonus

    # Sufficiency
    sufficiency_pct = min(100, round(total_min / max(sleep_need, 1) * 100))

    # Consistency
    if len(sleep_history_data) >= 2:
        durations_raw = [h.get("duration", 0) for h in sleep_history_data[-4:]]
        durations = [d * 60 if isinstance(d, float) and d < 24 else d for d in durations_raw if d > 0]
        if len(durations) >= 2:
            mean_dur = sum(durations) / len(durations)
            variance = sum((d - mean_dur) ** 2 for d in durations) / len(durations)
            std_dev = math.sqrt(variance)
            consistency_score = max(0, min(100, round(100 - std_dev * 1.67)))
        else:
            consistency_score = 65
    else:
        consistency_score = 65 if quality >= 60 else 40

    # Efficiency
    total_in_bed = total_min + awake
    efficiency_pct = round(total_min / max(total_in_bed, 1) * 100)

    # Sleep Stress
    awake_penalty = min(40, awake * 8)
    if stress_val > 60:
        stress_score = max(0, 100 - stress_val)
    elif stress_val > 30:
        stress_score = max(30, 100 - stress_val)
    else:
        stress_score = max(0, min(100, 100 - stress_val - awake_penalty))
    stress_level = "eleve" if stress_score < 40 else "modere" if stress_score < 70 else "faible"

    # Performance Score
    performance = round(sufficiency_pct * 0.40 + consistency_score * 0.20 + efficiency_pct * 0.25 + stress_score * 0.15)

    # Sleep Debt
    debt_days = []
    total_debt = 0
    for h in sleep_history_data:
        dur = h.get("duration", 0)
        dur_min = dur * 60 if isinstance(dur, float) and dur < 24 else dur
        deficit = max(0, sleep_need - dur_min)
        total_debt += deficit
        debt_days.append({"date": h.get("date", ""), "deficit_min": round(deficit), "actual": round(dur_min), "need": sleep_need})

    # Recovery
    recovery_base = min(100, performance * 0.5 + (hrv_val * 0.3 if hrv_val > 0 else 25) + max(0, (80 - rhr_val) * 0.5 if rhr_val > 0 else 15))
    recovery_score = round(max(0, min(100, recovery_base)))
    recovery_zone = "green" if recovery_score >= 67 else "yellow" if recovery_score >= 34 else "red"

    # Stage averages
    total_stages = deep + light + rem + awake
    stages_avg = {
        "deep_pct": round(deep / max(total_stages, 1) * 100),
        "light_pct": round(light / max(total_stages, 1) * 100),
        "rem_pct": round(rem / max(total_stages, 1) * 100),
        "awake_pct": round(awake / max(total_stages, 1) * 100),
    }

    # Recommended bedtime
    needed_hours = sleep_need / 60
    bed_hour = 7 - needed_hours
    if bed_hour < 0:
        bed_hour += 24
    recommended_bedtime = f"{int(bed_hour):02d}:{int((bed_hour % 1) * 60):02d}"

    # Weekly trend
    weekly_trend = []
    for h in sleep_history_data:
        dur = h.get("duration", 0)
        dur_min = dur * 60 if isinstance(dur, float) and dur < 24 else dur
        d_deep = h.get("deep", 0)
        d_light = h.get("light", 0)
        d_rem = h.get("rem", 0)
        d_awake = h.get("awake", 0)
        ts = d_deep + d_light + d_rem + d_awake
        weekly_trend.append({
            "date": h.get("date", ""), "duration": round(dur_min), "quality": h.get("quality", 0),
            "deep_pct": round(d_deep / max(ts, 1) * 100) if ts > 0 else 0,
            "light_pct": round(d_light / max(ts, 1) * 100) if ts > 0 else 0,
            "rem_pct": round(d_rem / max(ts, 1) * 100) if ts > 0 else 0,
            "awake_pct": round(d_awake / max(ts, 1) * 100) if ts > 0 else 0,
        })

    return {
        "has_data": True, "performance_score": performance,
        "sufficiency": {"score": sufficiency_pct, "actual_min": total_min, "need_min": sleep_need, "pct": sufficiency_pct},
        "consistency": {"score": consistency_score, "detail": f"Sur {len(sleep_history_data)} nuits"},
        "efficiency": {"score": efficiency_pct, "pct": efficiency_pct},
        "sleep_stress": {"score": stress_score, "level": stress_level},
        "debt": {"total_min": round(total_debt), "days": debt_days},
        "recovery": {"score": recovery_score, "zone": recovery_zone, "hrv": hrv_val, "rhr": rhr_val},
        "stages_avg": stages_avg, "sleep_need_min": sleep_need,
        "recommended_bedtime": recommended_bedtime, "weekly_trend": weekly_trend,
    }



@router.get("/health/sleep-alarm")
async def get_sleep_alarm(user=Depends(get_current_user)):
    """Get user's wake alarm and computed recommended bedtime"""
    uid = user['id']
    alarm = await db.sleep_alarms.find_one({"user_id": uid}, {"_id": 0})
    wake_time = alarm.get("wake_time", "07:00") if alarm else "07:00"
    enabled = alarm.get("enabled", True) if alarm else True

    # Compute recommended bedtime based on health data
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    age = 70  # default senior
    if u and u.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(u["date_of_birth"].replace("Z", "+00:00")) if isinstance(u["date_of_birth"], str) else u["date_of_birth"]
            age = (datetime.now(timezone.utc) - dob).days // 365
        except: pass

    # Base sleep need by age
    if age >= 65: base_min = 450  # 7h30
    elif age >= 50: base_min = 480  # 8h
    else: base_min = 480

    # Adjustments from health data
    extra_min = 0
    latest = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    reasons = []
    if latest and latest.get("data"):
        bd = latest["data"]
        recovery = bd.get("recovery_score", 0)
        stress = bd.get("stress_level", 0)
        sleep_q = bd.get("sleep_quality", 0)
        steps = bd.get("steps", 0)
        if recovery > 0 and recovery < 60:
            extra_min += 30
            reasons.append("Recuperation faible")
        if stress > 60:
            extra_min += 15
            reasons.append("Stress eleve")
        if sleep_q > 0 and sleep_q < 70:
            extra_min += 15
            reasons.append("Sommeil recent insuffisant")
        if steps > 8000:
            extra_min += 15
            reasons.append("Activite physique intense")

    total_sleep_min = base_min + extra_min

    # Compute bedtime from wake time
    try:
        wake_h, wake_m = map(int, wake_time.split(":"))
        wake_total_min = wake_h * 60 + wake_m
        bed_total_min = wake_total_min - total_sleep_min
        if bed_total_min < 0: bed_total_min += 1440
        bed_h = bed_total_min // 60
        bed_m = bed_total_min % 60
        bedtime = f"{bed_h:02d}:{bed_m:02d}"
    except:
        bedtime = "22:00"

    sleep_h = total_sleep_min // 60
    sleep_m = total_sleep_min % 60

    return {
        "wake_time": wake_time,
        "enabled": enabled,
        "bedtime": bedtime,
        "sleep_need_hours": sleep_h,
        "sleep_need_minutes": sleep_m,
        "adjustments": reasons,
        "base_hours": base_min // 60,
        "base_minutes": base_min % 60,
        "extra_minutes": extra_min,
    }


@router.put("/health/sleep-alarm")
async def set_sleep_alarm(data: dict, user=Depends(get_current_user)):
    """Set user's wake alarm time"""
    uid = user['id']
    wake_time = data.get("wake_time", "07:00")
    enabled = data.get("enabled", True)
    await db.sleep_alarms.update_one(
        {"user_id": uid},
        {"$set": {"user_id": uid, "wake_time": wake_time, "enabled": enabled, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    # Return updated recommendation
    return await get_sleep_alarm(user)
