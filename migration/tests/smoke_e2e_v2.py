"""Smoke test E2E Vague 2 — admin, professional, contract, advanced, extras."""
from __future__ import annotations

import uuid

import httpx

BASE = "http://127.0.0.1:8765"


def main() -> None:
    c = httpx.Client(base_url=BASE, timeout=10)

    # ── Inscription d'un admin et d'un pro ────────────────────────────────
    admin_email = f"admin+{uuid.uuid4().hex[:6]}@chutex.fr"
    r = c.post("/api/auth/register", json={
        "email": admin_email, "password": "Admin1234", "name": "Admin",
        "phone": f"+3361{uuid.uuid4().int % 100000000:08d}", "role": "admin",
    })
    assert r.status_code == 200, r.text
    admin_token = r.json()["token"]
    AH = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ Admin créé : {admin_email}")

    pro_email = f"pro+{uuid.uuid4().hex[:6]}@chutex.fr"
    r = c.post("/api/auth/register", json={
        "email": pro_email, "password": "Pro12345", "name": "Pro",
        "phone": f"+3362{uuid.uuid4().int % 100000000:08d}", "role": "professional",
    })
    assert r.status_code == 200, r.text
    pro_token = r.json()["token"]
    PH = {"Authorization": f"Bearer {pro_token}"}
    print(f"✅ Pro créé : {pro_email}")

    ben_email = f"ben+{uuid.uuid4().hex[:6]}@chutex.fr"
    r = c.post("/api/auth/register", json={
        "email": ben_email, "password": "Ben12345", "name": "Ben",
        "phone": f"+3363{uuid.uuid4().int % 100000000:08d}", "role": "beneficiary",
    })
    assert r.status_code == 200, r.text
    ben_token = r.json()["token"]
    BH = {"Authorization": f"Bearer {ben_token}"}
    ben_id = r.json()["user"]["id"]
    print(f"✅ Beneficiary créé : {ben_email}")

    # ── Admin : codes ─────────────────────────────────────────────────────
    r = c.post("/api/admin/activation-codes", json={
        "structure_name": "Test SAAD", "max_uses": 50,
    }, headers=AH)
    assert r.status_code == 200, r.text
    code_id = r.json()["id"]
    assert c.get("/api/admin/activation-codes", headers=AH).status_code == 200
    r = c.put(f"/api/admin/activation-codes/{code_id}/toggle", headers=AH)
    assert r.status_code == 200 and r.json()["active"] is False
    print("✅ Admin codes CRUD")

    # ── Admin : KPI / stats / users ───────────────────────────────────────
    assert c.get("/api/backoffice/stats").status_code == 200
    assert c.get("/api/backoffice/kpi").status_code == 200
    assert c.get("/api/backoffice/users").status_code == 200
    r = c.get(f"/api/backoffice/user/{ben_id}", headers=AH)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == ben_email
    print("✅ Backoffice KPI + user detail")

    # ── Admin : revenue ───────────────────────────────────────────────────
    r = c.get("/api/backoffice/revenue", headers=AH)
    assert r.status_code == 200
    print("✅ Backoffice revenue")

    # ── Pro : profile / dashboard ─────────────────────────────────────────
    r = c.get("/api/pro/profile", headers=PH)
    assert r.status_code == 200, r.text
    r = c.put("/api/pro/profile", json={
        "specialty": "Coach sportif", "structure_name": "TestPro",
    }, headers=PH)
    assert r.status_code == 200
    r = c.get("/api/pro/dashboard", headers=PH)
    assert r.status_code == 200
    print("✅ Pro profile + dashboard")

    # ── Pro : exercise template CRUD ─────────────────────────────────────
    r = c.post("/api/pro/exercise-templates", json={
        "title": "Pompes", "category": "musculation", "sets": 3, "repetitions": 10,
    }, headers=PH)
    assert r.status_code == 200, r.text
    tid = r.json()["id"]
    r = c.put(f"/api/pro/exercise-templates/{tid}", json={"title": "Pompes inclinées"}, headers=PH)
    assert r.status_code == 200
    r = c.get("/api/pro/exercise-templates", headers=PH)
    assert r.status_code == 200 and len(r.json()) >= 1
    r = c.delete(f"/api/pro/exercise-templates/{tid}", headers=PH)
    assert r.status_code == 200
    print("✅ Pro exercise templates CRUD")

    # ── Pro : meal & reminder templates ─────────────────────────────────
    r = c.post("/api/pro/meal-templates", json={"title": "Quinoa bowl", "calories": 450}, headers=PH)
    assert r.status_code == 200
    r = c.post("/api/pro/reminder-templates", json={"title": "Doliprane", "time": "08:00"}, headers=PH)
    assert r.status_code == 200
    assert c.get("/api/pro/meal-templates", headers=PH).status_code == 200
    assert c.get("/api/pro/reminder-templates", headers=PH).status_code == 200
    print("✅ Pro meal + reminder templates")

    # ── Pro : programs ───────────────────────────────────────────────────
    r = c.post(f"/api/pro/programs/{ben_id}", json={
        "title": "Programme test", "duration_weeks": 4,
    }, headers=PH)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    r = c.get(f"/api/pro/programs/{ben_id}", headers=PH)
    assert r.status_code == 200 and len(r.json()) >= 1
    r = c.put(f"/api/pro/programs/edit/{pid}", json={"description": "Programme MAJ"}, headers=PH)
    assert r.status_code == 200
    print("✅ Pro programs CRUD")

    # ── Pro : assign reminder/meal ───────────────────────────────────────
    r = c.post("/api/pro/assign-reminder", json={
        "beneficiary_id": ben_id, "title": "Hydratation", "time": "10:00",
    }, headers=PH)
    assert r.status_code == 200
    r = c.post("/api/pro/assign-meal", json={
        "beneficiary_id": ben_id, "title": "Petit dej", "items": [],
    }, headers=PH)
    assert r.status_code == 200
    print("✅ Pro assign reminder/meal")

    # ── Contract ──────────────────────────────────────────────────────────
    r = c.post("/api/contract/create", json={
        "plan": "standard", "price_monthly": 24.9,
        "beneficiary": {"user_id": ben_id, "name": "Ben", "phone": "+33611111111"},
        "delivery": {"address": "1 rue de Paris"},
    }, headers=BH)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    r = c.put(f"/api/contract/{cid}/validate", headers=AH)
    assert r.status_code == 200
    r = c.put(f"/api/contract/{cid}/sign", json={"signer": "Ben"}, headers=BH)
    assert r.status_code == 200
    r = c.put(f"/api/contract/{cid}/activate", headers=BH)
    assert r.status_code == 200, r.text
    sub_id = r.json()["subscription_id"]
    print(f"✅ Contract create→validate→sign→activate (sub={sub_id[:8]}…)")

    # ── Subscription rattachée au contrat ────────────────────────────────
    r = c.get("/api/subscriptions/my", headers=BH)
    assert r.status_code == 200 and r.json()["has_subscription"] is True
    print("✅ Subscription créée par contrat")

    # ── Advanced (Nora) ──────────────────────────────────────────────────
    r = c.get("/api/nora/morning-briefing", headers=BH)
    assert r.status_code == 200
    r = c.get("/api/nora/weekly-report", headers=BH)
    assert r.status_code == 200
    r = c.post("/api/nora/checkin-daily", json={}, headers=BH)
    assert r.status_code == 200 and r.json()["streak"] >= 1
    r = c.get("/api/nora/streak", headers=BH)
    assert r.status_code == 200
    print("✅ Nora briefings + streak")

    # ── Extras ───────────────────────────────────────────────────────────
    r = c.post("/api/glycemia/log", json={"value": 1.05, "zone": "normale"}, headers=BH)
    assert r.status_code == 200
    r = c.post("/api/vest/sync", json={"hr": 80, "battery": 90}, headers=BH)
    assert r.status_code == 200
    r = c.get("/api/batch/dashboard", headers=BH)
    assert r.status_code == 200
    r = c.get("/api/health/extended", headers=BH)
    assert r.status_code == 200
    r = c.get("/api/health/daily-report", headers=BH)
    assert r.status_code == 200
    print("✅ Extras (glycemia, vest, dashboards)")

    # ── Admin operations ──────────────────────────────────────────────────
    r = c.put(f"/api/admin/user/{ben_id}", json={"name": "Ben Update"}, headers=AH)
    assert r.status_code == 200
    r = c.get("/api/admin/devices-overview", headers=AH)
    assert r.status_code == 200
    r = c.get("/api/admin/health-overview", headers=AH)
    assert r.status_code == 200
    print("✅ Admin user mgmt + overviews")

    print("\n🎉 ALL VAGUE 2 SMOKE TESTS PASSED")


if __name__ == "__main__":
    main()
