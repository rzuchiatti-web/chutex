# CARE WATCH / Chutex - Product Requirements Document

## Vision
Application de **prévention santé personnalisée** pour les seniors. L'app transforme les données de santé en actions concrètes via des programmes guidés, un coach IA conversationnel, et un suivi motivant avec bilans et badges.

## Architecture
- **Frontend**: React Native (Expo) + Web, file-based routing
- **Backend**: FastAPI, Python
- **Database**: MongoDB (vitallink_db)
- **AI**: OpenAI GPT-4.1-mini via Emergent LLM Key

## Implemented Features

### Core Platform
- Phone-based login/registration with role-based multi-step onboarding
- Beneficiary & Guardian dashboards with role switching
- Coach Santé Intelligent (74+ health metrics analysis)
- Alert management, device monitoring, reminders system

### Dashboard Header (Feb 20)
- AI-generated health summary card with score badge
- Language selector (FR/EN/DE/ES/IT)
- Segmented tabs Bénéficiaire/Aidant with guardian activation popup

### Chat IA Santé (Feb 21)
- Conversational AI coach with full health context (score, pathologies, program, alerts)
- Accessible via floating button on dashboard
- Chat history, quick action suggestions

### Programmes de Prévention (Feb 21)
- 3 programs: "21 jours pour mieux dormir" (21 daily tasks), "14j tension", "30j activité"
- **Check-in matinal** auto-popup when active program has no checkin today
- Mood selector (1-5), notes, AI-generated feedback after each check-in
- **Bilans hebdomadaires** IA with this-week vs last-week comparisons
- **Streaks & badges** system (6 badges: streak milestones, first checkin, perfect mood)
- **Dedicated /programs page** with phases, tasks, badges grid, weekly report, stats

## Key API Endpoints
- `POST /api/chat/message` - Chat with health context
- `GET /api/programs/catalog` - Available programs
- `POST /api/programs/start/{id}` - Start program
- `GET /api/programs/active` - Active program + today's tasks + checkin status
- `POST /api/programs/checkin` - Daily check-in with AI feedback
- `GET /api/programs/badges` - Earned badges + stats
- `GET /api/programs/weekly-report` - AI weekly bilan
- `GET /api/health/summary` - AI health summary (1h cache)

## Test Credentials
| Role | Email | Password | Phone |
|---|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 | +33651245918 |

## Prioritized Backlog

### P1 (Next)
- Enrichir contenu programmes tension et activité (tâches quotidiennes détaillées)
- Bilan de fin de programme (avant/après avec visualisation)
- Notifications push pour les rappels de check-in

### P2
- Tutoriel connexion appareils
- Lefu Scale BLE fix
- Cohérence design globale de l'app

### P3
- Déploiement backend permanent
- Build natif J-Style
- Shopify, mode hors-ligne

## Known Issues
- Metro cache needs clearing after significant changes
- SMS mocked for forgot password
- Lefu Scale live data parsing incorrect
- ngrok tunnel connection intermittent
