# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API)

## What's Been Implemented

### Dorsi Smart Cushion — Complete
- BLE CDC integration (HeloKine01) with Web Bluetooth API
- Multi-step bilan with stepper, progressive gauge, pain per direction, radar chart with overlays
- **15 mini-games** full-screen immersive: Moutons, Bulles, Equilibre, Serpent, Labyrinthe, Slalom, Etoiles, Simon, Cercles, Course, Respiration, Pendule, Peinture, Rebond, Gravite
- Full-screen game page with HUD (live score, timer, combo), start/end screens, particles, glow effects
- 10-day program with smart game selection based on bilan weaknesses
- Score history tracking, dashboard card, bilan comparison

### i18n — 83 Components, 7 Languages
- FR, EN, DE, ES, IT, PT, NL — ~430 translation keys
- Bug fix: LanguagePicker case mismatch (uppercase/lowercase)
- Nora AI responds in user's selected language
- Coverage: ALL pages (onboarding, login, register, dashboard, health, teleconsult, devices, ECG, Dorsi, alerts, chat, profile, detail pages, admin, backoffice)

### VAPI Voice AI
- ElevenLabs multilingual voice (Lily), concise prompts, fast escalation
- If patient not OK → call guardians immediately

### Previous
- Alert escalation, SAAD intervention, health dashboard, subscriptions, RGPD

## Key Files
- `/app/frontend/app/dorsi-game.tsx` — Full-screen game engine (15 games)
- `/app/frontend/app/dorsi-bilan.tsx` — Bilan with stepper, radar overlay
- `/app/frontend/app/dorsi-program.tsx` — Program with free play grid
- `/app/frontend/src/context/I18nContext.tsx` — 765 lines, 7 languages
- `/app/backend/routes/dorsi_routes.py` — Dorsi API (bilans, programs, scores, dashboard)

## Prioritized Backlog
### P1
- Nora recommends exercises based on bilan
- Guardian referral system, Free 7-day trial

### P2
- Contract PDF, Vivoo, ElevenLabs voice cloning
- Test HeloKine01 physical device, Leaderboard
