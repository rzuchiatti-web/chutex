# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Bracelet V8 — Integration Complete
- [x] UUIDs: FFF6=WRITE, FFF7=NOTIFY
- [x] Detection V8 automatique par nom BLE
- [x] Parsing complet: 0x09 (steps), 0x28 (HR/SpO2/HRV/BP/stress/temp), 0x0D (battery), 0x50 (glucose), 0x26 (temperature 3-NTC), 0x53 (sleep), 0x33 (ECG result), 0x51/52 (steps hist), 0x54/55 (HR hist)
- [x] Polling periodique: realtime 10s, mesures completes 30s (incl glucose + temp V8), sync backend 60s
- [x] Envoi vers /api/bracelet/v8/push avec data_type correct
- [x] Auto-reconnexion au lancement via navigator.bluetooth.getDevices()
- [x] Stockage device sur window pour ECG
- [x] Nettoyage auto a la deconnexion

## ECG
- [x] Verifie /api/bracelet/status, redirige si pas connecte
- [x] Animation Whoop 30s, trace reel, save /api/ecg/start
- [x] Detail: trace + BPM + rythme uniquement

## Dashboard
- [x] Section Dispositifs toujours visible, batterie masquee si 0%
- [x] Backend batch connected/paired via last_sync

## Balance Lefu
- [x] Corrigee (sex, BIA, WiFi endpoints)
- [ ] WiFi non configure

## Backlog
- P1 : Rebuild EAS TestFlight
- P2 : Gilet, Parrainage, Essai 7j, Vivoo, Signature electronique
