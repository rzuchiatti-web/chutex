# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API)

## What's Been Implemented

### Dorsi Smart Cushion - Complete
- BLE CDC integration (HeloKine01) with Web Bluetooth API
- Multi-step bilan with stepper, progressive gauge, pain per direction, radar chart with overlays
- **15 mini-games** full-screen immersive
- 10-day program with smart game selection based on bilan weaknesses
- Score history tracking, dashboard card, bilan comparison

### i18n - Full Application Coverage, 7 Languages
- FR, EN, DE, ES, IT, PT, NL - ~140+ translation keys per language
- Language switching works on ALL pages: onboarding, login, dashboard, health, devices, alerts, profile, dorsi, ECG, etc.
- LanguagePicker component with flag display, persists via AsyncStorage
- Fixed: onboarding.tsx now uses useI18n() (was hardcoded French)
- Fixed: index.tsx (login) now uses useI18n() for all strings
- Fixed: devices.tsx uses t() for role-based titles
- Fixed: LanguagePicker title uses t('language')
- Fixed: I18nContext exports `flags` array for SharedUI.tsx LanguageFlagButton
- Nora AI responds in user's selected language

### VAPI Voice AI
- ElevenLabs multilingual voice (Lily), concise prompts, fast escalation
- Parallel calling: Nora stays on line while calling guardians

### Previous
- Alert escalation, SAAD intervention, health dashboard, subscriptions, RGPD

## Key Files
- `/app/frontend/app/dorsi-game.tsx` - Full-screen game engine (15 games)
- `/app/frontend/app/dorsi-bilan.tsx` - Bilan with stepper, radar overlay
- `/app/frontend/app/dorsi-program.tsx` - Program with free play grid
- `/app/frontend/src/context/I18nContext.tsx` - ~700 lines, 7 languages, 140+ keys each
- `/app/backend/routes/dorsi_routes.py` - Dorsi API (bilans, programs, scores, dashboard)

## Prioritized Backlog
### P1
- Nora recommends exercises based on bilan
- Guardian referral system, Free 7-day trial

### P2
- Contract PDF, Vivoo, ElevenLabs voice cloning
- Test HeloKine01 physical device, Leaderboard
- Badge "standby" du gilet: orange au lieu de vert
- Build natif iOS pour test BLE physique
