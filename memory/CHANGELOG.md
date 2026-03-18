# Chutex Care — CHANGELOG

## [Mars 2026] — Carte de localisation temps reel

### Ajout
- **LiveTrackingMap component**: Carte CartoDB dark tiles 3x3 intregee dans le banner Live Activity expande
- **Marqueur beneficiaire**: Pin GPS avec label "Beneficiaire" et badge coordonnees (lat/lng 4 decimales)
- **Marqueur intervenant**: Pin vert avec icone runner quand un intervenant a accepte
- **Enrichissement backend**: beneficiary_location et intervenant_location dans /api/alerts/live-active (depuis alert_tracking + intervention_tracking)
- **Localisation a la creation**: create_live_status() recupere la derniere position connue du beneficiaire

### Tests
- iteration_126.json: 15/15 backend + frontend 100%

---

## [Mars 2026] — Live Activity Push Notifications

### Ajout
- **Systeme Live Status Backend** (`live_status_routes.py`): Tracking en 6 etapes
- **Composant LiveAlertBanner** (`LiveAlertBanner.tsx`): Widget in-app style Uber Eats
- **iOS ActivityKit** (`ChutexAlertLiveActivity.swift`, `LiveActivityModule.swift`)
- **Service liveActivity.ts**: Bridge React Native vers module natif iOS
- **Endpoint POST /api/push/live-activity-token**

### Tests
- iteration_125.json: 11/11 backend + frontend 100%

---

## [Mars 2026] — Admin Dashboard Overhaul + WebSocket Alerts

### Ajout
- Dashboard admin complet 9 modules
- Alertes WebSocket (/ws/admin-alerts)
- Onglet Documents avec export PDF
- Brevet V3 Glycemia ML Algorithm

### Tests
- iteration_121 a 124
