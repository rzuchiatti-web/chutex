# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| Beneficiaire (Marie Test) | 0600000099 | test123 |
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | robin123 |

## Completed Features

### Mar 1, 2026 - Ecosysteme Programmes Prevention (Phase 1 & 2)

**3 programmes enrichis scientifiquement:**
- "21 jours pour mieux dormir" — base sur la chronobiologie (Walker 2017, Cajochen 2011, Haghayegh 2019, etc.)
- "14 jours pour stabiliser sa tension" — regime DASH, recommandations OMS/AHA
- "30 jours pour bouger plus" — recommandations OMS seniors, etudes Stanford/NASA

**Chaque programme inclut:**
- `benefits` (5 benefices prouves)
- `data_used` (5-6 metriques suivies)
- `medical_disclaimer` (avertissement medical)
- `onboarding_fields` (2-6 questions de personnalisation)
- `tracked_metrics` (metriques pour le bilan avant/apres)
- `effort` (temps quotidien)
- 21 missions quotidiennes avec explication scientifique (champ `mission`) et references d'etudes

**Snapshot sante avant/apres:**
- `health_snapshot_start` capture automatiquement les donnees sante au demarrage du programme
- `health_comparison` dans le bilan de fin compare avant/apres pour chaque metrique suivie
- Indicateur d'amelioration (improved: true/false) pour chaque metrique

**Dashboard programme ameliore:**
- Carte programme active avec phase en cours, mission du jour, statut check-in
- Progression des membres de l'equipe visible (check-in fait/pas fait)

**Equipe programme:**
- Le endpoint /programs/active inclut maintenant `team` avec le statut de check-in de chaque membre

### Mar 1, 2026 - Nora IA Contextuelle & Intelligente
- Service nora_context.py avec contexte utilisateur complet
- Reponses coherentes sans donnees (tableaux vides)
- Chat enrichi avec connaissance des services Chutex
- Recommandations intelligentes (age, abonnement, appareils)

### Mar 1, 2026 - Emails, Gestion abonnements, Mot de passe oublie
(sessions precedentes — tout complet)

### Mar 1, 2026 - Mode Equipe + Page Programme Amelioree
**Backend - Invitation par telephone:**
- `POST /api/programs/team/invite-by-phone` : Si le telephone correspond a un beneficiaire existant → notification in-app (collection `team_invitations`). Sinon → SMS via SMS Mode.
- `GET /api/programs/team/invitations` : Liste des invitations en attente
- `POST /api/programs/team/invitations/{id}/accept` : Accepte et ajoute au team
- `POST /api/programs/team/invitations/{id}/reject` : Refuse l'invitation

**Frontend - Page programme amelioree (`program-detail.tsx`):**
- 4 etapes : Presentation → Personnalisation (onboarding) → Invite amis (si equipe) → Lancement
- Affiche benefices prouves, metriques suivies par Nora, phases progressives, avertissement medical
- Invite par telephone avec feedback (notification in-app ou SMS)

**Frontend - Dashboard invitations equipe:**
- Carte d'invitation avec accepter/refuser sur le dashboard
- Fetch automatique des invitations pending

**Frontend - Catalogue programmes enrichi (`programs.tsx`):**
- Section "Programmes disponibles" avec effort, difficulte, benefices preview

## Upcoming Tasks
- P0: Build iOS TestFlight
- P1: Tests complets du flux equipe sur device (invitation SMS, notification, accept/reject)

## Future/Backlog
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production (Dockerfile)
- Historique des paiements Stripe

## Key Files
- `backend/routes/program_routes.py`: Programmes, check-ins, bilans, equipes, snapshot sante
- `backend/services/nora_context.py`: Contexte IA enrichi
- `backend/routes/health_report_routes.py`: Rapport sante + analyse par section
- `backend/routes/chat_routes.py`: Chat Nora
- `frontend/app/(tabs)/index.tsx`: Dashboard avec carte programme + mission du jour + equipe
- `frontend/src/components/ProgramDailyView.tsx`: Vue quotidienne avec science, equipe, bilan avant/apres
- `frontend/app/program-detail.tsx`: Detail programme (presentation + onboarding)
- `frontend/app/programs.tsx`: Page programmes avec catalogue enrichi
