# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS)

## What's Been Implemented

### Dorsi Smart Cushion - Complete
- Shared BLE context (DorsiBLEContext) — persistent across pages
- acceptAllDevices BLE scanning, real BLE measurements in bilan
- 15 mini-games with cartoon visuals, animated backgrounds
- Game logic fixes: serpent game-over on self-bite, course/gravite game-over on collision
- Dorsi Index (0-100) merged with Bilan CTA + info popups
- Streaks calendar (14 days), score history visible
- Carousel swipable for free games with best scores
- HUD: record comparison in real-time, "NOUVEAU RECORD!" indicator
- Score history on game launch screen
- Programme adaptatif IA (GPT-5.2)

### i18n - 7 Languages, VAPI Voice AI, Previous features
- All implemented and working

## Prioritized Backlog
### P1
- Guardian referral system, Free 7-day trial
### P2
- Correlations sante (infrastructure ready), Contract PDF, Vivoo, Build natif iOS
