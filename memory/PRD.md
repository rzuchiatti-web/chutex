# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Nora IA — Actions via Chat
- [x] UPDATE_CALORIES, ADJUST_MACROS, ADD_EXERCISE, DELETE_EXERCISE, UPDATE_MEAL_PLAN, LIST_EXERCISES

### Balance Connectee (Lefu CF586BLE+WIFI)
- [x] Bug sex=2 corrige, bug device non initialise corrige, filtre <20kg
- [x] Timing WeighingFlow reduit (50s->20s), alias backend pour tous les noms de champs
- [x] Formules BIA locales : 18 metriques sans impedance
- [x] Endpoints WiFi complets (register, weighing, record, config, torre)
- [ ] WiFi non configure : necessite PPBTKitDemo (Android) pour 25+ metriques Lefu
- [ ] Impedance BLE chiffree par hardware Lefu

### Bracelet V8 (JStyle BLE)
- [x] Bug critique UUIDs inverses corrige (FFF6=WRITE, FFF7=NOTIFY) — decouvert via SDK
- [x] Backend V8 complet : config, push, ECG parser, glucose, VO2max, 15 modes sport
- [x] Commandes ECG correctes du SDK : 0x28+0x04 (pas 0x32)
- [x] Parsing ECG 24-bit (3 bytes par sample, SDK getECG)
- [x] Batterie filtre 0-100 (rejet 255)
- [x] **BraceletBLEContext global** — Partage connexion BLE entre pages (bracelet-connect <-> ecg)
- [x] **Verification connexion avant ECG** — Plus de popup BLE si non connecte
- [ ] Donnees vitales (FC, SpO2, pas) remontent a 0 — a investiguer

### ECG Temps Reel
- [x] Page ecg.tsx reecrite avec vrai flux BLE V8
- [x] Animation respiration style Whoop (cercle expansif 30s, orange/bleu)
- [x] Sauvegarde vraies donnees ECG via /api/ecg/start
- [x] Redirection directe vers ecg-detail (plus de page intermediaire)
- [x] Backend /api/ecg/start accepte vraies donnees BLE + fallback simule
- [x] **Page ecg-detail affiche vrai graphe ECG depuis donnees sauvegardees**
- [x] **Page ecg-detail affiche vitaux V8 (FC, HRV, Respiration, Stress, Humeur, Tension, Age vasc.)**
- [x] **Fetch par ID (/api/ecg/{id}) au lieu de juste /api/ecg/history**

### Morning Briefing, Popup Sommeil, Rappels, Dashboard
- [x] Tous les features precedents conserves

## Architecture BLE
```
BraceletBLEProvider (global context in _layout.tsx)
  |
  +-- bracelet-connect.tsx  -- setConnection() apres appairage
  |
  +-- ecg.tsx               -- useBraceletBLE() pour verifier/reutiliser connexion
  |
  +-- (future pages)        -- peuvent utiliser useBraceletBLE()
```

## Backlog
- P1 : Fix donnees vitales bracelet V8 (FC, SpO2 = 0) 
- P1 : Configurer WiFi balance via PPBTKitDemo
- P1 : Rebuild EAS pour TestFlight
- P2 : Gilet connecte, Parrainage, Essai 7j, Vivoo
- P2 : Refactoring program_routes.py, teleassistance_routes.py
- P2 : Deploiement production serveur TCP J2358
- P2 : Signature electronique documents Admin
- Minor : Creer page /sleep (route declaree mais fichier manquant)
