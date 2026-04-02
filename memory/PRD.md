# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Bracelet V8 — Integration Complete
- [x] Detection V8 auto, parsing complet (0x09, 0x28, 0x0D, 0x50, 0x26, 0x53, 0x33, 0x51/52/54/55)
- [x] Polling periodique: realtime 10s, mesures 30s (glucose+temp), sync 60s
- [x] Auto-reconnexion via getDevices()
- [x] Envoi vers /api/bracelet/v8/push avec data_type correct

## Page Sante
- [x] Daily-report lit les donnees V8 depuis devices.last_* (fallback du consolidated)
- [x] ECG historique integre dans le daily-report (ecg_history)
- [x] Carte ECG en bas de la page sante avec historique cliquable
- [x] Carte Pesee avec historique des pesees
- [x] Vitaux: FC, SpO2, Tension, Temperature affiches depuis donnees reelles
- [x] Glycemie estimee (PPG) via GlycemiaCard

## ECG
- [x] Verifie connexion, animation Whoop, trace reel
- [x] Detail: trace + BPM + rythme

## Dashboard
- [x] Section Dispositifs toujours visible, batterie masquee si 0%
- [x] Backend batch connected/paired via last_sync

## Balance Lefu
- [x] Corrigee (sex, BIA, WiFi endpoints)

## Backlog
- P1 : Rebuild EAS TestFlight
- P2 : Gilet, Parrainage, Essai 7j, Vivoo, Signature electronique
