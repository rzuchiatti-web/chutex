# CARE WATCH / Chutex - PRD

## Vision
App de **prévention santé personnalisée** pour seniors. Programmes guidés, coach IA, suivi motivant.

## Architecture
React Native (Expo) + FastAPI + MongoDB + GPT-4.1-mini (Emergent LLM Key)

## Implemented Features (Feb 20-21, 2026)

### Core: Login/registration phone-based, dashboards multi-rôle, Coach Santé 74+ métriques
### Header: Résumé IA, langue, onglets Bénéficiaire/Aidant, activation gardien
### Chat IA: Coach conversationnel personnalisé (contexte santé complet), bouton flottant
### Programmes:
- 3 programmes complets: Sommeil 21j (21 tâches), Tension 14j (14 tâches), Activité 30j (30 tâches)
- Check-in matinal popup automatique (humeur 1-5, notes, feedback IA)
- Bilans hebdomadaires IA (comparaison semaine vs semaine)
- Streaks & 6 badges (3j, 7j, 14j, 21j, premier check-in, jour parfait)
- Bilan de fin de programme IA (avant/après, réalisations, prochaines étapes)
- Page dédiée /programs (détails, phases, badges, bilan, stats)
### Tutoriel connexion appareils (banner quand non connectés)
### Bug fixes: Dossier médical (surgeries), CSS display:none header

## Key Endpoints
POST /api/chat/message | GET /api/chat/history | DELETE /api/chat/clear
GET /api/programs/catalog | POST /api/programs/start/{id} | GET /api/programs/active
POST /api/programs/checkin | GET /api/programs/badges | GET /api/programs/weekly-report
GET /api/programs/completion-report/{id} | POST /api/programs/stop
GET /api/health/summary | GET /api/health/daily-report

## Credentials
robert.martin@email.fr / demo123 / +33651245918

## Backlog
P1: Notifications push rappels check-in, partage social badges
P2: Lefu Scale BLE fix, déploiement permanent
P3: Shopify, mode hors-ligne, build natif J-Style
