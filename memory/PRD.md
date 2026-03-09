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

### Poids & Nutrition (Weight & Nutrition) - Complete (March 2026)
- **Backend**: New endpoint `GET /api/minceur/weight-details` — fetches user profile, weight history from scale, calculates IMC/BMR/TDEE, body composition, generates daily AI recommendations (meals + exercises) via GPT-5.2 with daily caching
- **Backend**: `POST /api/minceur/weight-goal` — optional weight goal setter, invalidates cache
- **Backend**: `DELETE /api/minceur/weight-goal` — remove goal
- **Backend**: `POST /api/minceur/refresh-recommendations` — force refresh
- **Frontend**: Complete rewrite of `/minceur.tsx` as permanent health dashboard:
  - Weight Hero Card: current weight, BMI with color-coded gauge, weight evolution SVG chart
  - **Tabbed Charts**: 3 onglets Poids/Graisse/Muscle — chaque indicateur a son propre graphique SVG animé avec couleurs distinctes (ambre/orange/vert)
  - Body Composition: animated ring charts (fat%, muscle%, hydration%, visceral fat) + bone mass, body age, protein
  - Optional Goal Setter: +/- weight target with week duration selector
  - AI Recommendations: Nora insight, daily calorie budget with macros, water intake
  - Meals Tab: 4 detailed meal cards with ingredients, portions, calories, timing
  - Exercises Tab: home exercises adapted for seniors with duration, intensity, calories
  - Tip of the Day
  - Premium clinical UI with animations, glass morphism
- **Health Tab Card**: Mini-tabs Poids/Graisse/Muscle avec mini sparkline bars qui changent selon l'onglet sélectionné
- **Testing**: 100% pass (iteration_93 backend 19/19 + iteration_94 frontend 100%)

## Prioritized Backlog
### P1
- Guardian referral system, Free 7-day trial
### P2
- Correlations sante (infrastructure ready), Contract PDF, Vivoo, Build natif iOS
