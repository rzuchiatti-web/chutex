# CHUTEX (Elio) - PRD

## Problem Statement
Application de sante connectee iOS (React Native + WebView + FastAPI) pour le suivi biometrique via bracelet V8 (Elio), balance Lefu, et IA GPT-5.2. Zero donnees simulees.

## Architecture
- **Frontend**: Expo Router (React Native) avec WebView. BLE via `react-native-ble-plx` cote natif iOS.
- **Backend**: FastAPI + MongoDB (`vitallink_db`). Background tasks pour rappels/vibrations.
- **Bridge BLE**: `bleV8Bridge.ts` (frontend) -> `bracelet_routes.py` (backend).

## User Personas
- Beneficiaire: Personne agee portant le bracelet
- Gardien: Proche surveillant a distance
- SAAD: Organisme de tele-assistance
- Admin: Gestion des comptes et abonnements

## Core Requirements
- [x] Integration bracelet V8 (BLE natif iOS)
- [x] Suppression totale des mocks
- [x] Daily Health Report (GPT-5.2 via Emergent LLM Key)
- [x] Systeme de rappels avec vibration bracelet (0x36)
- [x] Dashboard multi-roles (Beneficiaire, Gardien, SAAD, Entreprise)
- [x] Safe Area iOS (padding 70px global)
- [x] Reconnexion BLE automatique au lancement
- [x] Validation stricte des donnees biometriques

## Completed (Build 100)
- [x] Timezone fix: `zoneinfo('Europe/Paris')` dans les 3 background tasks
- [x] Padding 70px global sur 30+ composants (popups, overlays, pages)
- [x] Auto-reconnect BLE dans _layout.tsx (scan auto au lancement)
- [x] Splash overlay natif sombre (elimine le flash blanc)
- [x] Loader ADN visible min 2s sur page Sante
- [x] Validation HR max 200, SpO2 min 60-100, BP 70-200/40-130
- [x] Double validation: raw_data + device update
- [x] Raw hex logging dans bleV8Bridge + endpoint /api/bracelet/v8/debug
- [x] Nettoyage des donnees invalides en base (HR=220, SpO2=36)
- [x] Build number incremente a 100

## Backlog
- [ ] P1: Valider flux BLE complet avec vrai bracelet V8
- [ ] P1: Config WiFi balance Lefu
- [ ] P2: Serveur TCP J2358 production
- [ ] P2: Gilet connecte
- [ ] P2: Signature Electronique Admin
- [ ] P2: Parrainage Gardiens
- [ ] P2: Essai gratuit 7j
- [ ] P2: Test urinaire Vivoo
- [ ] P2: Refactoring teleassistance_routes.py

## Key Endpoints
- POST /api/bracelet/v8/push - Reception donnees V8
- POST /api/bracelet/v8/vibrate - Commande vibration 0x36
- GET /api/bracelet/v8/debug - Diagnostic raw hex
- GET /api/bracelet/status - Etat bracelet
- GET /api/health/daily-report - Rapport sante IA
