# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Nora IA — Actions via Chat
- [x] UPDATE_CALORIES, ADJUST_MACROS, ADD_EXERCISE, DELETE_EXERCISE, UPDATE_MEAL_PLAN, LIST_EXERCISES
- [x] Contexte enrichi : exercices du jour + nutrition

### Balance Connectee (Lefu)
- [x] Parsing dynamique de TOUTES les metriques Lefu (58+ metriques)
  - Base: poids, IMC, graisse, muscle, os, eau, metabolisme, age corporel, proteines, score sante
  - Etendu: muscle squelettique, graisse sous-cutanee, masse maigre, poids ideal, obesite, controle graisseux/musculaire
  - Segmentaire: graisse et muscle par bras/jambe/tronc (8 electrodes)
  - all_lefu_metrics stocke en brut pour futurs usages
- [x] Flow WiFi Configuration BLE
  - Bouton "Configurer WiFi" dans scale-detail quand balance connectee en BLE
  - Modal: SSID + mot de passe + avertissement 2.4GHz
  - Envoi credentials via BLE characteristic FFF2 → balance se connecte au WiFi
  - Pesees automatiques sans telephone apres configuration

### Morning Briefing, Popup Sommeil, Rappels, Dashboard
- [x] Tous les features precedents conserves

## Backlog
- P1 : Deploiement TCP J2358
- P2 : Gilet connecte, Signature electronique, Parrainage, Essai 7j, Vivoo
