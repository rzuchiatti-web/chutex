# CARE WATCH / Chutex - Product Requirements Document

## Original Problem Statement
Full-stack health monitoring and prevention platform for elderly care. The app aims to be a **personalized prevention coach** that helps users improve their health through actionable programs, AI-powered guidance, and tracked results.

## Vision
Transform from a data dashboard into a **meaningful health companion** where users know exactly what to do, see real results, and stay engaged long-term through personalized programs and AI coaching.

## Architecture
- **Frontend**: React Native (Expo) with web support, file-based routing
- **Backend**: FastAPI, Python  
- **Database**: MongoDB (vitallink_db)
- **AI**: OpenAI GPT-4.1-mini via Emergent LLM Key

## What's Been Implemented

### Session 1 (Previous)
- Coach Sante Intelligent (LLM analysis of 74+ metrics)
- Login/Registration overhaul (phone-based, glassmorphism, medical questionnaire)
- Beneficiary dashboard & reminders, Alert thresholds
- Profile page medical editor

### Session 2 (Current - Feb 20-21, 2026)
- **Dashboard Header Redesign** - AI summary, language picker, segmented tabs, guardian activation popup
- **Chat IA Sante** - Full conversational AI coach with personalized health context
- **Programmes de Prevention** - "21 jours pour mieux dormir" + 2 more programs with daily tasks, check-ins, AI feedback
- **Floating Chat Button** - Accessible from dashboard
- **Bug Fix** - Dossier medical surgeries crash

## Key Files
- `backend/routes/chat_routes.py` - Chat AI (message, history, clear)
- `backend/routes/program_routes.py` - Programs (catalog, start, active, checkin, stop)
- `backend/routes/health_report_routes.py` - Health summary + daily report
- `frontend/app/chat.tsx` - Chat page
- `frontend/app/(tabs)/index.tsx` - Dashboard (programs section + chat FAB)

## Key API Endpoints
- `POST /api/chat/message` - Send message, get AI response with health context
- `GET /api/chat/history` - Chat history
- `GET /api/programs/catalog` - Available programs
- `POST /api/programs/start/{id}` - Start program
- `GET /api/programs/active` - Active program + today's tasks
- `POST /api/programs/checkin` - Daily check-in with AI feedback
- `GET /api/health/summary` - AI health summary (1h cache)

## DB Collections
- `chat_messages` - user_id, session_id, role, content, created_at
- `programs` - Seeded catalog (sleep 21d, tension 14d, activity 30d)
- `program_enrollments` - user_id, program_id, current_day, streak, status
- `program_checkins` - enrollment_id, mood, note, tasks_done, date
- `health_summary_cache` - user_id, summary, score, status (1h TTL)

## Test Credentials
| Role | Email | Password | Phone |
|---|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 | +33651245918 |

## Prioritized Backlog
### P0 (Next)
- Check-in matinal intégré au programme actif
- Bilans hebdomadaires automatiques
- Page dédiée programmes (vue détaillée + historique)

### P1
- Catalogue de programmes enrichi (tensions, activité physique)
- Système de streaks/badges visuels
- Bilan de fin de programme (avant/après)

### P2
- Tutoriel connexion appareils
- Lefu Scale BLE fix
- Cohérence design globale

### P3
- Déploiement backend permanent
- Build natif J-Style
- Shopify, mode hors-ligne

## Known Issues
- Metro cache needs clearing after significant changes
- SMS mocked for forgot password
- Lefu Scale live data parsing incorrect
