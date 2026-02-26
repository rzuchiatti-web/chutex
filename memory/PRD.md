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
- Glass-morphism UI pour popups et cartes
- Morning Briefing conditionnel (Nora welcome / resume sante)
- Chat IA avec OpenAI GPT-4o via Emergent LLM Key
- Back-office admin refactore
- Systeme d'alertes (Vapi.ai + SMS Mode)
- Gestion des roles (Beneficiaire, Gardien, SAAD, Admin, Teleassistance)
- Pages RGPD / Protection des donnees
- **P0 FIX: Dashboard zero-data pour nouveaux utilisateurs** (Feb 2026)
- **P1: Popups glass appairage integrees au dashboard** (Feb 2026)
  - Bracelet Elio: 3 etapes (charge → voyant bleu → scan)
  - Gilet Elder: 4 etapes (porter → ajuster → activer bouton avant bas → scan)
  - Balance Lefu: 2 etapes (placer → monter)
  - Animation scan BLE avec anneaux pulse
  - Boutons Associer/Decouvrir pour appareils non associes
  - IDs appareils retires des popups
- Pages bracelet-pairing.tsx et vest-pairing.tsx supprimees (tout dans DeviceCards popup)

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |
| TestUIZero (no devices) | +33699001122 | test123 |

## Statut actuel
- P0 zero-data fix: COMPLETE
- P1 popups appairage glass: COMPLETE
- Build iOS: BLOQUE (quota Expo)
- Vapi.ai international: BLOQUE (plan gratuit)

## Taches a venir (priorite)
1. P1: Continuer checkup page par page (retours utilisateur restants)
2. P1: Audit i18n complet
3. P2: Page abonnement SAAD

## Backlog
- Tests materiel natif (apres fix build iOS)
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production

## Integrations tierces
- Vapi.ai, SMS Mode, Expo EAS Build
- expo-local-authentication (biometrie)
- OpenAI GPT-4o via Emergent LLM Key
- Materiel: Lefu Smart Scale, J-Style bracelet, Elder S-AIRBAG vest

## Fichiers cles
- `frontend/src/components/dashboard/DeviceCards.tsx` - Popups appairage + dashboard appareil
- `frontend/src/components/dashboard/VitalsRow.tsx` - Affichage '--' sans donnees
- `frontend/src/components/dashboard/ActivitySleep.tsx` - Etat vide 'Aucune donnee'
- `backend/routes/device_routes.py` - dashboard-summary sleep=null sans bracelet
- `frontend/app/(tabs)/index.tsx` - Fallbacks zeros
