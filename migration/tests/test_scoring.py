"""Tests unitaires des algos scoring (sans DB)."""
import sys
sys.path.insert(0, "/app/migration")

from api.services.scoring import (
    cardio_score, sleep_score, activity_score, stress_score,
    body_age, daily_report, aging_score,
)


# ── Cardio ──
r = cardio_score(heart_rate=68, hrv=85, spo2=98, age=45)
assert r["score"] >= 80, r
print(f"✅ Cardio (FC=68, HRV=85, SpO2=98, 45ans) → {r['score']}")

r2 = cardio_score(heart_rate=110, hrv=20, spo2=88, age=70)
assert r2["score"] < r["score"], "Mauvais cardio doit avoir score plus bas"
print(f"✅ Cardio degraded → {r2['score']}")

# ── Sleep ──
s = sleep_score(duration_min=480, deep_min=120, rem_min=110, wake_count=1)
assert s["score"] >= 80, s
print(f"✅ Sleep (8h, 25% deep, REM ok) → {s['score']}")

s2 = sleep_score(duration_min=240, deep_min=20, wake_count=8)
assert s2["score"] < 50, s2
print(f"✅ Sleep degraded → {s2['score']}")

# ── Activity ──
a = activity_score(steps=10000, active_min=45, calories=2200, age=40)
assert a["score"] >= 80, a
print(f"✅ Activity (10k pas, 45min actif) → {a['score']}")

# ── Stress ──
st = stress_score(stress_level=20)
assert st["score"] == 80
print(f"✅ Stress low → {st['score']}")

# ── Body age ──
ba = body_age(age=50, weight_kg=85, height_cm=180, body_fat_pct=30,
              muscle_pct=28, visceral_fat=14)
assert ba["body_age"] > 50, "body age supérieur quand profil défavorable"
print(f"✅ Body age (50 ans, surpoids+graisse viscerale) → {ba['body_age']} ans (delta +{ba['delta']})")

ba2 = body_age(age=50, weight_kg=70, height_cm=180, body_fat_pct=18,
               muscle_pct=42, visceral_fat=6)
assert ba2["body_age"] < 50, "body age plus jeune avec bon profil"
print(f"✅ Body age (50 ans, sportif) → {ba2['body_age']} ans (delta {ba2['delta']})")

# ── Daily report ──
vitals = [
    {"heart_rate": 70, "spo2": 97, "hrv": 75, "steps": 8000, "calories": 1800,
     "sleep_quality": 85, "sleep_duration_min": 450},
    {"heart_rate": 72, "spo2": 98, "hrv": 80, "steps": 0, "calories": 0},
]
dr = daily_report(vitals=vitals, latest_scale={"weight": 75, "body_fat_pct": 22, "muscle_pct": 38},
                  age=45, height_cm=178)
assert dr["global_score"] >= 60, dr
print(f"✅ Daily report → global={dr['global_score']}, cardio={dr['subscores']['cardio']}, sleep={dr['subscores']['sleep']}, body_age={dr['body_age']['body_age']}")

# ── Aging ──
ag = aging_score(body_age_value=42, real_age=50, global_score=85)
assert ag["score"] >= 80, ag
print(f"✅ Aging (50ans, body 42, score 85) → {ag['score']} ({ag['level']})")

ag2 = aging_score(body_age_value=68, real_age=50, global_score=40)
assert ag2["score"] < 50
print(f"✅ Aging dégradé → {ag2['score']} ({ag2['level']})")

print("\n🎉 ALL SCORING TESTS PASSED")
