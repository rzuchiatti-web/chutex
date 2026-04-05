from datetime import datetime, timezone
from datetime import timedelta
import math
from fastapi import APIRouter, Depends
from database import db
from auth import get_current_user

router = APIRouter()

@router.get("/health/sleep")
async def get_sleep_data(user=Depends(get_current_user)):
    """Return the latest night's sleep with REAL minute-by-minute stages from V8 bracelet."""
    uid = user['id']
    # Get all V8 sleep segments with real stages
    all_sleep = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.cmd": 0x53, "data.sleep_stages": {"$exists": True, "$ne": []}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(200)

    if not all_sleep:
        return {"stages": [], "total_minutes": 0, "deep_minutes": 0, "light_minutes": 0, "rem_minutes": 0, "awake_minutes": 0, "sleep_quality": 0, "cycles": 0, "sleep_duration": 0, "date": datetime.now(timezone.utc).isoformat(), "source": "none"}

    # Group segments by bracelet date (night)
    nights = _group_sleep_by_night(all_sleep)
    if not nights:
        return {"stages": [], "total_minutes": 0, "deep_minutes": 0, "light_minutes": 0, "rem_minutes": 0, "awake_minutes": 0, "sleep_quality": 0, "cycles": 0, "sleep_duration": 0, "date": datetime.now(timezone.utc).isoformat(), "source": "none"}

    # Return the most recent night
    latest_date = sorted(nights.keys())[-1]
    return nights[latest_date]


def _extract_bcd_date_from_raw(raw_hex: str) -> tuple:
    """Extract BCD date and time from raw_hex of a 0x53 sleep packet."""
    try:
        parts = raw_hex.split(':')
        if len(parts) < 9:
            return "", ""
        seg_idx = int(parts[1], 16)
        if seg_idx == 0xFF:
            return "", ""
        bcd = lambda b: f"{(int(b, 16) >> 4) & 0xf}{int(b, 16) & 0xf}"
        year = f"20{bcd(parts[3])}"
        month = bcd(parts[4])
        day = bcd(parts[5])
        hour = bcd(parts[6])
        minute = bcd(parts[7])
        return f"{year}-{month}-{day}", f"{hour}:{minute}"
    except:
        return "", ""


def _group_sleep_by_night(readings: list) -> dict:
    """Group V8 sleep segments by night, concatenate real stages, compute metrics."""
    nights_raw: dict = {}
    for r in readings:
        dd = r.get("data", {})
        raw_hex = dd.get("raw_hex", "")

        # Get date: from parsed field, or extract from raw_hex, or server timestamp
        dt = dd.get("sleep_date", "")
        start_time = dd.get("sleep_start_time", "")
        if not dt and raw_hex:
            dt, start_time = _extract_bcd_date_from_raw(raw_hex)
        if not dt:
            dt = r.get("timestamp", "")[:10]
        if not dt or len(dt) < 10:
            continue
        dt = dt[:10]

        # Get segment index from parsed field or from raw_hex
        seg_idx = dd.get("segment_index")
        if seg_idx is None and raw_hex:
            try:
                seg_idx = int(raw_hex.split(':')[1], 16)
            except:
                seg_idx = 0
        if seg_idx is None:
            seg_idx = 0

        if dt not in nights_raw:
            nights_raw[dt] = {}
        # Deduplicate by segment_index (keep the one with most stages)
        existing = nights_raw[dt].get(seg_idx)
        stages_new = dd.get("sleep_stages", [])
        if not existing or len(stages_new) > len(existing.get("sleep_stages", [])):
            nights_raw[dt][seg_idx] = {**dd, "sleep_start_time": start_time or dd.get("sleep_start_time", "")}

    nights = {}
    for dt, segments in nights_raw.items():
        # Concatenate stages in segment order (highest index = earliest in night)
        all_stages = []
        earliest_time = ""
        for seg_idx in sorted(segments.keys(), reverse=True):
            seg = segments[seg_idx]
            all_stages.extend(seg.get("sleep_stages", []))
            t = seg.get("sleep_start_time", "")
            if t and (not earliest_time or t < earliest_time):
                earliest_time = t

        if not all_stages:
            continue

        # Normalize stages: 1=deep, 2=light, 3=REM, 4/0=awake
        normalized = [s if s in (1, 2, 3) else 0 for s in all_stages]
        deep = normalized.count(1)
        light = normalized.count(2)
        rem = normalized.count(3)
        awake = normalized.count(0)
        total_sleep = deep + light + rem
        total_duration = len(normalized)

        # Count interruptions (transitions to awake from sleep)
        interruptions = 0
        for i in range(1, len(normalized)):
            if normalized[i] == 0 and normalized[i - 1] != 0:
                interruptions += 1

        # Count cycles (deep→REM = 1 cycle)
        cycles = 0
        had_deep = False
        for s in normalized:
            if s == 1:
                had_deep = True
            if s == 3 and had_deep:
                cycles += 1
                had_deep = False
        cycles = max(cycles, 1) if total_sleep > 30 else 0

        # Quality score
        quality = min(100, round((deep * 2 + rem * 1.5 + light) / max(total_sleep, 1) * 50)) if total_sleep > 0 else 0

        nights[dt] = {
            "date": dt,
            "start_time": earliest_time,
            "stages": normalized,
            "total_minutes": total_duration,
            "deep_minutes": deep,
            "light_minutes": light,
            "rem_minutes": rem,
            "awake_minutes": awake,
            "sleep_quality": quality,
            "cycles": cycles,
            "sleep_interruptions": interruptions,
            "sleep_duration": round(total_sleep / 60, 1),
            "segments_count": len(segments),
            "source": "bracelet",
        }
    return nights


@router.get("/health/sleep/history")
async def get_sleep_history(user=Depends(get_current_user)):
    """Return per-night sleep summaries with real aggregated data from V8 bracelet."""
    uid = user['id']
    all_sleep = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.cmd": 0x53, "data.sleep_stages": {"$exists": True, "$ne": []}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(500)

    if not all_sleep:
        return []

    nights = _group_sleep_by_night(all_sleep)
    history = []
    for dt in sorted(nights.keys()):
        n = nights[dt]
        total_sleep = n["deep_minutes"] + n["light_minutes"] + n["rem_minutes"]
        history.append({
            "date": dt,
            "duration": round(total_sleep / 60, 1),
            "duration_min": total_sleep,
            "deep": n["deep_minutes"],
            "light": n["light_minutes"],
            "rem": n["rem_minutes"],
            "awake": n["awake_minutes"],
            "quality": n["sleep_quality"],
            "cycles": n["cycles"],
            "sleep_interruptions": n["sleep_interruptions"],
            "start_time": n.get("start_time", ""),
            "stages": n["stages"],  # Real minute-by-minute stages for hypnogram
        })
    return history[-7:]


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
