# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS voice)

## What's Been Implemented

### Dorsi Smart Cushion - Complete + Innovations
- BLE via shared DorsiBLEContext (persists across pages)
- acceptAllDevices BLE scanning (compatible with all cushion names)
- Multi-step bilan with real BLE measurements when connected
- 15 mini-games on dedicated full-screen page
- Dorsi Index (0-100), Streaks calendar (14 days), Comparaison anonymisee
- Programme adaptatif IA (GPT-5.2)
- Jeux libres en carrousel swipable avec best scores
- HUD en jeu: comparaison en temps reel avec le record + "NOUVEAU RECORD!"
- Ecran de lancement: historique des 5 derniers scores
- Sensibilite BLE doublee (x12 au lieu de x6)
- Batterie: -1 par defaut (pas de faux 100%)

### i18n - 7 Languages
- FR, EN, DE, ES, IT, PT, NL - ~140+ keys per language

### VAPI Voice AI + Previous features
- ElevenLabs voice, parallel calling, alert escalation, health dashboard, subscriptions

## Key Files
- `/app/frontend/src/context/DorsiBLEContext.tsx` - Shared BLE state across pages
- `/app/frontend/app/dorsi-game.tsx` - Full-screen game engine (15 games) with score history
- `/app/frontend/app/dorsi-program.tsx` - Program page with carousel, index, streaks
- `/app/frontend/app/dorsi-bilan.tsx` - Bilan with real BLE measurements
- `/app/backend/routes/dorsi_routes.py` - All Dorsi APIs

## Prioritized Backlog
### P1
- Guardian referral system, Free 7-day trial
- Correlations sante croisees (infrastructure ready, UI hidden for now)

### P2
- Contract PDF, Vivoo, Leaderboard
- Badge "standby" gilet orange, Build natif iOS BLE
