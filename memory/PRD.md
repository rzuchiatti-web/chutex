# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS voice)

## What's Been Implemented

### Dorsi Smart Cushion - Complete + 6 Innovations
- BLE CDC integration (HeloKine01) with Web Bluetooth API
- Multi-step bilan with stepper, progressive gauge, pain per direction, radar chart with overlays
- **15 mini-games** full-screen immersive
- 10-day program with smart game selection based on bilan weaknesses
- Score history tracking, dashboard card, bilan comparison
- **NEW: Dorsi Index (0-100)** — Composite score (mobility 30pts + pain 25pts + regularity 25pts + progression 20pts)
- **NEW: Comparaison anonymisee** — Percentile vs other users in same age group
- **NEW: Streaks & Calendrier** — GitHub-style 28-day calendar, current/best streak, fire icon
- **NEW: Seances guidees par Nora** — ElevenLabs voice guides exercises with step-by-step instructions
- **NEW: Correlations sante croisees** — Cross-correlate Dorsi with sleep, weight, activity, heart rate
- **NEW: Programme adaptatif IA** — GPT-5.2 generates personalized programs based on bilan progression

### i18n - Full Application Coverage, 7 Languages
- FR, EN, DE, ES, IT, PT, NL - ~140+ translation keys per language
- Language switching works on ALL pages including onboarding and login

### VAPI Voice AI
- ElevenLabs multilingual voice (Lily), concise prompts, fast escalation
- Parallel calling: Nora stays on line while calling guardians

### Previous
- Alert escalation, SAAD intervention, health dashboard, subscriptions, RGPD

## Key Files
- `/app/frontend/app/dorsi-program.tsx` - Program page with all 6 innovations
- `/app/frontend/app/dorsi-game.tsx` - Full-screen game engine (15 games)
- `/app/frontend/app/dorsi-bilan.tsx` - Bilan with stepper, radar overlay
- `/app/frontend/src/context/I18nContext.tsx` - 7 languages, 140+ keys each
- `/app/backend/routes/dorsi_routes.py` - Dorsi API including Index, Streaks, Correlations, Adaptive, TTS

## New API Endpoints
- `GET /api/dorsi/index` - Dorsi Index (0-100)
- `GET /api/dorsi/streaks` - Streaks & activity calendar
- `GET /api/dorsi/comparison` - Anonymized comparison by age group
- `GET /api/dorsi/correlations` - Health cross-correlations
- `POST /api/dorsi/adaptive-program` - GPT-5.2 adaptive program generation
- `POST /api/dorsi/guided-tts` - ElevenLabs TTS for Nora voice
- `GET /api/dorsi/guided-instructions/{game_id}` - Game-specific voice instructions

## Prioritized Backlog
### P1
- Guardian referral system, Free 7-day trial

### P2
- Contract PDF, Vivoo, ElevenLabs voice cloning
- Test HeloKine01 physical device, Leaderboard
- Badge "standby" du gilet: orange au lieu de vert
- Build natif iOS pour test BLE physique
