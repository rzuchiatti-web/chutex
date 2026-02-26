# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" - plateforme complete avec React Native (Expo) frontend, FastAPI backend, MongoDB. Gestion des alertes, surveillance sante, integration materiel BLE, back-office admin.

## Architecture
- Frontend: React Native (Expo) avec expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- Hebergement preview: Emergent Platform (Kubernetes)

## Fonctionnalites implementees
- Flux d'authentification complet (onboarding, login, register)
- LanguagePicker reusable sur tout le flux auth
- Verification SMS lors de l'inscription
- Login biometrique (Face ID/empreinte) - natif uniquement
- Back-office admin refactore
- Systeme d'alertes redesigne (Vapi.ai + SMS Mode)
- Gestion des roles (Beneficiaire, Gardien, SAAD, Admin, Teleassistance)
- Chat IA avec OpenAI GPT-4o
- Pages RGPD / Protection des donnees
- Images compressees pour les roles (beneficiaire + gardien)
- Glass-morphism UI pour popups et cartes
- Morning Briefing conditionnel (Nora welcome / resume sante)
- **P0 FIX: Dashboard zero-data pour nouveaux utilisateurs** (Feb 2026)
- **P1: Cartes appareils redesignees** - boutons Associer/Decouvrir pour appareils non associes (Feb 2026)
- **P1: Flow appairage bracelet Elio** - 3 etapes (charge -> bouton -> scan) (Feb 2026)
- **P1: Flow appairage gilet Elder** - 4 etapes (porter -> ajuster -> activer -> scan) (Feb 2026)
- **P1: IDs appareils retires** des popups de detail (Feb 2026)

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |
| SAAD (test) | 612345678 | demo123 |
| TestUIZero (no devices) | +33699001122 | test123 |

## Statut actuel
- P0 zero-data fix: COMPLETE (Feb 2026)
- P1 checkup page par page: EN COURS
- Build iOS: BLOQUE (quota Expo)
- Vapi.ai international: BLOQUE (plan gratuit)
- Lefu Scale BLE: BLOQUE (crash iOS)

## Taches a venir (priorite)
1. P1: Continuer checkup page par page (retours utilisateur restants)
2. P1: Audit i18n complet
3. P2: Page abonnement SAAD
4. P3: Tests materiel natif complet

## Backlog
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production (Dockerfile, docker-compose)

## Integrations tierces
- Vapi.ai (appels vocaux IA)
- SMS Mode (notifications SMS)
- Expo EAS Build (builds natifs)
- expo-local-authentication (biometrie)
- OpenAI GPT-4o (analyse IA) via Emergent LLM Key
- Materiel: Lefu Smart Scale, J-Style bracelet, Elder S-AIRBAG vest

## Fichiers cles modifies (dernier sprint)
- `backend/routes/device_routes.py` - dashboard-summary: sleep=null quand pas de bracelet
- `frontend/app/(tabs)/index.tsx` - fallbacks zeros au lieu de donnees simulees
- `frontend/src/components/dashboard/VitalsRow.tsx` - affiche '--' quand pas de donnees
- `frontend/src/components/dashboard/ActivitySleep.tsx` - etat vide 'Aucune donnee'
- `frontend/src/components/dashboard/DeviceCards.tsx` - boutons Associer/Decouvrir, IDs retires
- `frontend/app/bracelet-pairing.tsx` - NOUVEAU: flow appairage bracelet
- `frontend/app/vest-pairing.tsx` - NOUVEAU: flow appairage gilet
- `frontend/app/_layout.tsx` - routes bracelet-pairing et vest-pairing ajoutees
