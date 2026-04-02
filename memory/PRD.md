# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Bracelet V8 — Flux BLE Complet
- [x] UUIDs corrigees (FFF6=WRITE, FFF7=NOTIFY)
- [x] Detection V8 par nom device (V8, JCV8, 2301, HB8, ELIO)
- [x] **Polling periodique** : commandes realtime toutes les 10s
- [x] **Sync complete** toutes les 30s (batterie, steps, HR, SpO2, HRV, BP)
- [x] **Sync backend** toutes les 60s via /api/devices/sync
- [x] **Envoi vers /api/bracelet/v8/push** (pas l'ancien /api/bracelet/push)
- [x] **Stockage device** sur window.__bleBraceletDevice pour ECG
- [x] **Nettoyage** auto a la deconnexion BLE
- [x] **setBleVitals** mis a jour en temps reel (HR, SpO2, battery, steps, etc.)
- [x] Commandes ECG: 0x28+0x04, parsing 24-bit

### ECG
- [x] Verifie /api/bracelet/status avant de lancer
- [x] Si pas connecte → redirection vers Dispositifs
- [x] Animation respiration Whoop 30s
- [x] Page ecg-detail : trace ECG reel + BPM + rythme

### Dashboard - Section Dispositifs
- [x] Section TOUJOURS visible (meme sans device)
- [x] Etat vide : 'Aucun dispositif connecte' + bouton ajouter
- [x] Batterie masquee si = 0%
- [x] Backend batch : connected/paired calcule via last_sync

### Balance Connectee (Lefu)
- [x] Bug sex=2 corrige, formules BIA, endpoints WiFi
- [ ] WiFi non configure

### Nettoyage
- [x] bracelet-connect.tsx SUPPRIME
- [x] BraceletBLEContext.tsx SUPPRIME

## Backlog
- P1 : Configurer WiFi balance via PPBTKitDemo
- P1 : Rebuild EAS pour TestFlight
- P2 : Gilet connecte, Parrainage, Essai 7j, Vivoo
- P2 : Refactoring program_routes.py, teleassistance_routes.py
