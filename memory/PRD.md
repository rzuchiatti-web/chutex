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
- **P0 FIX: Crash iOS RESOLU** (Feb 2026)

## iOS Crash Resolution (Build 44)
### Causes identifiees et corrigees:
1. **Reanimated v4 + Old Architecture incompatible**: `newArchEnabled` passe a `true`
2. **babel.config.js manquant**: Cree avec `babel-preset-expo`
3. **react-native-worklets manquant**: Ajoute comme dependance explicite
4. **Violation des Rules of Hooks dans AuthScreen (index.tsx)**: `useRef` appeles apres des `return` conditionnels - deplaces en haut du composant
5. **selectedPfx non defini**: Corrige avec derivation depuis PREFIXES

### Build History:
- Build 38: CRASH (Old Arch + Reanimated v4)
- Build 40: CRASH (New Arch mais hooks bug)
- Build 41: OK (diagnostic minimal)
- Build 42: OK (Error Boundary - erreur hooks visible)
- Build 43: OK (fix hooks - login visible)
- Build 44: OK (production propre sans Error Boundary)

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |

## Statut actuel
- P0 crash iOS: RESOLU
- Modules natifs (BLE, notifications, biometrie): NON INSTALLES (a reintegrer)
- Vapi.ai international: BLOQUE (plan gratuit)

## Taches a venir (priorite)
1. P0: Reintegrer modules natifs (react-native-ble-plx, expo-notifications, expo-local-authentication)
2. P1: Tests materiel natif (bracelet, balance, gilet)
3. P1: Audit i18n complet
4. P2: Page abonnement SAAD

## Backlog
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production

## Integrations tierces
- Vapi.ai, SMS Mode, Expo EAS Build
- OpenAI GPT-4o via Emergent LLM Key
- Materiel: Lefu Smart Scale, J-Style bracelet, Elder S-AIRBAG vest

## Fichiers cles modifies
- `frontend/app.json` - newArchEnabled: true, buildNumber: 44
- `frontend/babel.config.js` - NOUVEAU
- `frontend/package.json` - worklets, babel-preset, cleanup
- `frontend/app/index.tsx` - Fix hooks order
- `frontend/app/_layout.tsx` - Restaure proprement
