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

### Mar 1, 2026 - 10 Programmes de Prevention Scientifiques
**10 programmes complets bases sur des etudes scientifiques :**
1. "21 jours pour mieux dormir" (sommeil) — Walker 2017, Cajochen 2011
2. "14 jours pour stabiliser sa tension" (cardiovasculaire) — DASH, OMS/AHA
3. "30 jours pour bouger plus" (activite) — OMS seniors, Stanford 2020
4. "21 jours pour mieux manger" (nutrition) — PREDIMED, NutriNet-Sante, Zones Bleues
5. "21 jours pour prevenir les chutes" (equilibre) — Sherrington 2019, HAS
6. "21 jours pour apaiser l'esprit" (bien-etre) — HeartMath 2009, Holzel 2011
7. "14 jours pour booster sa memoire" (cognitif) — ACTIVE Ball 2002, MIND Diet
8. "21 jours pour renforcer son coeur" (cardio-endurance) — AHA 2018, Wisloff 2007
9. "14 jours pour ameliorer sa posture" (posture) — Hayden 2005, Hansraj 2014
10. "14 jours pour mieux respirer" (respiratoire) — Bernardi 2001, McCraty 2009

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

### Mar 1, 2026 - Fonctionnalites Avancees (Impact Immediat + Premium)
**1. Rapport hebdomadaire email Nora** (`POST /api/nora/send-weekly-report`):
- Score sante, tendances 7j, programme en cours, streak, alertes, conseil Nora IA
- Email envoye au beneficiaire ET aux gardiens via Mailjet

**2. Morning Briefing enrichi** (`GET /api/nora/morning-briefing`):
- Nora genere un briefing personnalise avec donnees reelles, programme du jour, objectifs IA
- Alertes predictives integrees

**3. Streaks & Recompenses** (`POST /api/nora/checkin-daily`, `GET /api/nora/streak`):
- Streak quotidien avec badges (7j, 14j, 30j, 60j, 100j)
- Persistance en base, max streak, total jours

**4. Nora Vocale TTS** (`POST /api/nora/speak`, `POST /api/nora/speak-briefing`):
- Text-to-Speech via OpenAI TTS (voix Nova, vitesse 0.95 pour seniors)
- Briefing du matin en audio MP3

**5. Alertes Predictives** (`GET /api/nora/predictive-check`):
- Analyse des tendances 7 jours : FC repos, HRV, sommeil, stress, activite
- Alertes proactives AVANT que le probleme survienne
- Types : heart_rate_rising, hrv_declining, sleep_declining, stress_rising, activity_declining

**6. Mode Intervenant a Domicile** (`GET /api/intervenant/visit/{id}`, `POST /api/intervenant/visit/{id}/observation`):
- Vue beneficiaire complete pour les intervenants en visite
- Ajout d'observations (etat general, mobilite, humeur, appetit, douleur, traitements)
- Option "Alerter le medecin" qui cree une alerte automatique
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
- 🔴 Frontend : tableau de bord gardien enrichi (resume visuel en 1 coup d'oeil)
- 🔴 Frontend : ecran intervenant a domicile (vue visite + formulaire observation)
- 🟠 Build iOS TestFlight

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
