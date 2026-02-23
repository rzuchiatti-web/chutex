# CARE WATCH - PRD

## Problem Statement
Application de santé préventive "CARE WATCH" centrée sur des programmes guidés (21-Day Deep Sleep, 14-Day Cardio Fit, 30-Day Activity). L'objectif est de transformer l'app d'un simple dashboard de données en un moteur de transformation santé engageant et personnalisé.

## Architecture
- **Frontend**: React Native / Expo (web + mobile)
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-4.1-mini via Emergent LLM Key
- **Devices**: Bracelet J-Style, Balance Lefu, Gilet S-AIRBAG

## Core Features
### Programmes de Santé (Core Engine)
- Catalogue de 6 programmes (sommeil, tension, activité, etc.)
- Onboarding personnalisé (7 questions pour le sommeil)
- Vue quotidienne immersive avec missions cochables
- Check-in quotidien (humeur 1-5, note, tâches)
- Feedback IA personnalisé basé sur les données capteurs
- Simulation J1→J21 avec navigation par flèches
- Bilans automatiques J7/J14/J21 (IA)
- Bilan final avant/après avec stats détaillées
- Badges et streak de motivation
- Modes Solo / Duo / Groupe

### Chat IA (Coach Santé)
- Interface glassmorphism
- Contexte conversationnel
- Effet typewriter
- Bouton proéminent au centre de la navbar

### Dashboard Bénéficiaire
- Score santé IA (96/100)
- Appareils connectés (bracelet, balance, gilet)
- Carte programme actif
- Carte alertes avec historique
- Bouton SOS

### Multi-rôles
- Bénéficiaire, Aidant, Admin, Prescripteur, Structure (SAAD)

## Key API Endpoints
- `GET /api/programs/catalog` - Catalogue des programmes
- `GET /api/programs/active?day=X` - Programme actif (simulation)
- `POST /api/programs/start/{id}` - Démarrer un programme
- `POST /api/programs/checkin` - Check-in quotidien
- `GET /api/programs/weekly-report` - Bilan hebdomadaire IA
- `GET /api/programs/completion-report/{id}` - Bilan final IA
- `GET /api/programs/badges` - Badges gagnés
- `POST /api/chat` - Chat IA
- `GET /api/health/daily-report` - Rapport santé quotidien

## Files of Reference
- `frontend/app/(tabs)/health.tsx` - Page Santé principale
- `frontend/app/(tabs)/_layout.tsx` - Navigation/Navbar
- `frontend/app/program-detail.tsx` - Onboarding programme
- `frontend/src/components/ProgramDailyView.tsx` - Vue quotidienne programme
- `backend/routes/program_routes.py` - API programmes

## Credentials
| Role | Phone | Password |
|------|-------|----------|
| Beneficiary | +33651245918 | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## What's Implemented (Feb 2026)
- [x] Programme complet 21j sommeil avec missions quotidiennes
- [x] Questionnaire d'onboarding 7 questions
- [x] Vue quotidienne immersive (ProgramDailyView)
- [x] Check-in interactif (humeur, tâches, note)
- [x] Feedback IA quotidien
- [x] Bilans J7/J14/J21 avec rapports IA
- [x] Badges et streak
- [x] Simulation des jours (J1→J21)
- [x] Chat IA avec glassmorphism
- [x] Navbar redessinée (alertes retirées, IA au centre)
- [x] Dashboard multi-rôles
- [x] Backend programmes complet

## Backlog
### P0
- Améliorer état vide Chat IA
- Refactoring health.tsx (1300+ lignes)

### P1
- Partage social rapports santé & badges
- UI programmes en équipe (backend existe)
- Tutoriel connexion appareils

### P2
- Build natif + intégration BLE
- Intégration Shopify
- Mode hors-ligne intervenants

## Known Issues
- Expo tunnel ngrok échoue (utilisation export statique web)
- Balance Lefu BLE parsing incorrect (hardware)
- SMS mot de passe oublié simulé (MOCKED)
