# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone/Email | Password |
|------|-------------|----------|
| Admin | admin@chutex.fr | demo123 |
| Beneficiaire (Robin) | +33651245918 | test123 |
| Teleassistance | plateau@chutex.fr | demo123 |

## Completed Features

### Mar 2, 2026 - Refactoring Page Dispositifs + Correctifs Critiques
**Correctifs:**
- Corrige erreur login `Invalid salt` - reinitialisation des comptes admin/test
- Nouveau endpoint `POST /api/devices/associate` : cree un nouvel appareil pour l'utilisateur (verifie abonnement pour bracelet)
- `GET /api/devices` filtre maintenant les appareils supprimes (`removed: true`)
- `DeviceCards.tsx` (dashboard) utilise maintenant `/api/devices/associate` au lieu de scan vide

**Refactoring page dispositifs (`devices.tsx`):**
- Integration du flux d'appairage etape par etape (pairing flow) directement dans la page Dispositifs
- Configuration des etapes pour chaque appareil (BRACELET_STEPS, VEST_STEPS, SCALE_STEPS)
- Composant `GlassOverlay` reutilisable pour les popups
- Bouton "Associer" lance le flux d'appairage guide au lieu d'appeler directement `sync`
- Animation de scan Bluetooth avec feedback visuel
- Popup de succes "Appareil associe !" apres association reussie
- Popup de detail d'appareil avec batterie, derniere synchro, option supprimer
- Boutons Synchroniser et Details pour les appareils deja associes
- Popup abonnement requis pour le bracelet sans abonnement

### Mar 1, 2026 - 10 Programmes de Prevention Scientifiques
**10 programmes complets bases sur des etudes scientifiques:**
1. "21 jours pour mieux dormir" (sommeil)
2. "14 jours pour stabiliser sa tension" (cardiovasculaire)
3. "30 jours pour bouger plus" (activite)
4. "21 jours pour mieux manger" (nutrition)
5. "21 jours pour prevenir les chutes" (equilibre)
6. "21 jours pour apaiser l'esprit" (bien-etre)
7. "14 jours pour booster sa memoire" (cognitif)
8. "21 jours pour renforcer son coeur" (cardio-endurance)
9. "14 jours pour ameliorer sa posture" (posture)
10. "14 jours pour mieux respirer" (respiratoire)

### Mar 1, 2026 - Nora IA Contextuelle & Intelligente
- Service nora_context.py avec contexte utilisateur complet
- Reponses coherentes sans donnees (tableaux vides)
- Chat enrichi avec connaissance des services Chutex
- Recommandations intelligentes (age, abonnement, appareils)

### Mar 1, 2026 - Fonctionnalites Avancees
- Rapport hebdomadaire email Nora
- Morning Briefing enrichi
- Streaks & Recompenses
- Nora Vocale TTS
- Alertes Predictives
- Mode Intervenant a Domicile
- Invitation equipe programme par telephone

## Upcoming Tasks
- Bouton "Modifier moyen de paiement" sur la page abonnement (non fonctionnel)
- Verification builds mobiles (iOS #60, Android)
- Email rapport hebdomadaire automatise (cron)

## Future/Backlog
- Systeme de parrainage gardien
- Rapport PDF sante partageable
- Programme d'essai gratuit 7 jours
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production

## Key Files
- `backend/routes/device_routes.py`: Endpoints dispositifs (associate, sync, remove, dashboard-summary)
- `frontend/app/(tabs)/devices.tsx`: Page dispositifs avec flux d'appairage
- `frontend/src/components/dashboard/DeviceCards.tsx`: Cartes dispositifs dashboard
- `backend/services/nora_context.py`: Contexte IA enrichi
- `backend/routes/program_routes.py`: Programmes sante
- `frontend/app/(tabs)/index.tsx`: Dashboard beneficiaire
