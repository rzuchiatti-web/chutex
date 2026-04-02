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
- [x] Bug sex=2 corrige, filtre <20kg, alias backend
- [x] Formules BIA locales : 18 metriques sans impedance
- [x] Endpoints WiFi complets
- [ ] WiFi non configure : necessite PPBTKitDemo
- [ ] Impedance BLE chiffree par hardware

### Bracelet V8 (JStyle BLE)
- [x] UUIDs corrigees (FFF6=WRITE, FFF7=NOTIFY)
- [x] Backend V8 complet : config, push, ECG parser, glucose, VO2max
- [x] Commandes ECG: 0x28+0x04
- [x] Parsing ECG 24-bit
- [ ] Donnees vitales (FC, SpO2, pas) remontent a 0

### ECG
- [x] Page ecg.tsx verifie /api/bracelet/status avant de lancer
- [x] Si pas connecte → redirection vers Dispositifs
- [x] Animation respiration Whoop 30s
- [x] Sauvegarde vraies donnees ECG via /api/ecg/start
- [x] Page ecg-detail : trace ECG reel + BPM + rythme + verification auto + analyse Nora

### Dashboard - Section Dispositifs
- [x] **Section TOUJOURS visible** (meme sans device)
- [x] **Etat vide** : 'Aucun dispositif connecte' + bouton 'Ajouter un dispositif'
- [x] **Batterie masquee** si = 0% (plus de 0% affiche)
- [x] **Backend batch** : connected/paired calcule via last_sync (plus de champ raw)
- [x] Bouton + redirige vers /(tabs)/devices
- [x] bracelet-connect.tsx SUPPRIME
- [x] BraceletBLEContext.tsx SUPPRIME

### Page Dispositifs
- [x] Gere connexion bracelet, balance, gilet
- [x] Bouton ECG visible quand bracelet appaire

### Morning Briefing, Popup Sommeil, Rappels, Dashboard
- [x] Tous les features precedents conserves

## Backlog
- P1 : Fix donnees vitales bracelet V8 (FC, SpO2 = 0)
- P1 : Configurer WiFi balance via PPBTKitDemo
- P1 : Rebuild EAS pour TestFlight
- P2 : Gilet connecte, Parrainage, Essai 7j, Vivoo
- P2 : Refactoring program_routes.py, teleassistance_routes.py
- P2 : Deploiement production serveur TCP J2358
- P2 : Signature electronique documents Admin
- Minor : Creer page /sleep (route declaree mais fichier manquant)
