# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Bracelet V8 — Integration Complete
- [x] Detection V8 auto, parsing complet (tous les cmd 0x09-0x55)
- [x] Polling periodique: realtime 10s, mesures 30s, sync 60s
- [x] Auto-reconnexion via getDevices()
- [x] Vibration bracelet (0x08) pour rappels et reveil
- [x] Pending commands: backend stocke, frontend poll et envoie via BLE
- [x] Glycemie BLE → auto-calibration ML (V3 population model)

## Vibration Bracelet
- [x] Endpoint /api/bracelet/v8/vibrate
- [x] Endpoint /api/bracelet/v8/pending-commands
- [x] Rappels medicaments → vibration bracelet
- [x] Rappel coucher (bedtime) → vibration bracelet
- [x] Frontend poll pending-commands toutes les 60s et envoie 0x08

## Glycemie ML
- [x] Glucose BLE V8 → auto-calibration dans glycemia_calibrations
- [x] Re-estimation ML automatique a chaque push glucose
- [x] Modele V3 population (Gradient Boosting) + calibrations V8

## ECG
- [x] Flow complet, detail avec trace reel
- [x] Historique ECG dans page sante

## Dashboard + Page Sante
- [x] Section Dispositifs toujours visible
- [x] Daily-report lit donnees V8 via last_* fallback
- [x] Donnees simulees supprimees partout

## Backlog
- P1 : Rebuild EAS TestFlight
- P2 : Gilet, Parrainage, Essai 7j, Vivoo
