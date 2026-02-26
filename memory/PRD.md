# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" - plateforme complete avec React Native (Expo) frontend, FastAPI backend, MongoDB. Gestion des alertes, surveillance sante, integration materiel BLE, back-office admin.

## Architecture
- Frontend: React Native (Expo SDK 54) avec expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- Hebergement preview: Emergent Platform (Kubernetes)
- Architecture native: **New Architecture** (Fabric/TurboModules) activee

## Fonctionnalites implementees
- Flux d'authentification complet (onboarding, login, register)
- Glass-morphism UI pour popups et cartes
- Morning Briefing conditionnel (Nora welcome / resume sante)
- Chat IA avec OpenAI GPT-4o via Emergent LLM Key
- Back-office admin refactore
- Systeme d'alertes (Vapi.ai + SMS Mode)
- Gestion des roles (Beneficiaire, Gardien, SAAD, Admin, Teleassistance)
- Pages RGPD / Protection des donnees
- P0 FIX: Dashboard zero-data pour nouveaux utilisateurs
- P1: Popups glass appairage integrees au dashboard
- **P0 FIX: Crash iOS resolu** (Feb 2026) - Passage a New Architecture + babel config + worklets

## iOS Build History
- Build 38: CRASH - Reanimated v4 + Old Architecture incompatible
- Build 39: EN ATTENTE - Fix: newArchEnabled=true, babel.config.js, react-native-worklets

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |
| TestUIZero (no devices) | +33699001122 | test123 |

## Statut actuel
- P0 crash iOS fix: PRET A TESTER (build 39)
- Vapi.ai international: BLOQUE (plan gratuit)
- Modules natifs (BLE, notifications, biometrie): NON INSTALLES (a reintegrer apres validation build 39)

## Corrections appliquees (Build 39)
1. `app.json`: `newArchEnabled: true` (requis pour Reanimated v4)
2. `babel.config.js`: Cree avec `babel-preset-expo` preset
3. `package.json`: Ajoute `react-native-worklets@0.5.1` (peer dep Reanimated v4)
4. `package.json`: Ajoute `babel-preset-expo@~54.0.10`
5. `package.json`: Retire `react-native-chart-kit` (inutilise)
6. `package.json`: Retire `react-native-dotenv` (inutilise)
7. `app.json`: `buildNumber` incremente a 39

## Taches a venir (priorite)
1. P0: Valider build iOS 39 sur TestFlight
2. P0: Reintegrer modules natifs (react-native-ble-plx, expo-notifications, expo-local-authentication)
3. P1: Tests materiel natif (bracelet, balance, gilet)
4. P1: Audit i18n complet
5. P2: Page abonnement SAAD

## Backlog
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production

## Integrations tierces
- Vapi.ai, SMS Mode, Expo EAS Build
- OpenAI GPT-4o via Emergent LLM Key
- Materiel: Lefu Smart Scale, J-Style bracelet, Elder S-AIRBAG vest

## Fichiers cles modifies (Build 39)
- `frontend/app.json` - newArchEnabled: true, buildNumber: 39
- `frontend/babel.config.js` - NOUVEAU
- `frontend/package.json` - worklets, babel-preset, cleanup
