# Chutex Care — CHANGELOG

## [Mars 2026] — Live Activity Push Notifications

### Ajout
- **Systeme Live Status Backend** (`live_status_routes.py`): Tracking en 6 etapes des alertes avec creation automatique, avancement, et completion
- **Composant LiveAlertBanner** (`LiveAlertBanner.tsx`): Widget in-app style Uber Eats avec glassmorphism, barre de progression, timeline chronologique, boutons d'action (Suivre, Intervenir, Appeler)
- **iOS ActivityKit** (`ChutexAlertLiveActivity.swift`, `LiveActivityModule.swift`): Widget Lock Screen + Dynamic Island pour iOS 16.1+
- **Service liveActivity.ts**: Bridge React Native vers module natif iOS ActivityKit
- **Endpoint POST /api/push/live-activity-token**: Enregistrement tokens APNs pour mises a jour push Live Activity
- **Hooks dans alert_routes.py, vapi_engine.py, carewatch_engine.py**: Integration automatique du live status a chaque etape du processus d'alerte

### Modifie
- `alert_routes.py`: Ajout creation live status a la creation d'alerte, completion a la resolution
- `push_routes.py`: Payloads push enrichis avec flag live_activity et donnees beneficiaire
- `GuardianHome.tsx`: Integration du LiveAlertBanner en haut du dashboard gardien
- `vapi_engine.py`: Hooks advance_live_status aux transitions d'etat
- `carewatch_engine.py`: Hook advance_live_status au demarrage appel patient

### Tests
- iteration_125.json: 11/11 tests backend passes, frontend 100% (Live Activity)
- pytest: test_live_activity_status.py

---

## [Mars 2026] — Admin Dashboard Overhaul + WebSocket Alerts

### Ajout
- Dashboard admin complet avec 9 modules
- Alertes WebSocket temps reel (/ws/admin-alerts)
- Onglet Documents avec export PDF
- Brevet V3 Glycemia ML Algorithm

### Tests
- iteration_121 à 124: Admin dashboard, WebSocket, Documents
