# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Mollie (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS)

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
  - **Tabbed Charts**: 3 onglets Poids/Graisse/Muscle — chaque indicateur a son propre graphique SVG anime avec couleurs distinctes (ambre/orange/vert)
  - Body Composition: animated ring charts (fat%, muscle%, hydration%, visceral fat) + bone mass, body age, protein
  - Optional Goal Setter: +/- weight target with week duration selector
  - AI Recommendations: Nora insight, daily calorie budget with macros, water intake
  - Meals Tab: 4 detailed meal cards with ingredients, portions, calories, timing
  - Exercises Tab: home exercises adapted for seniors with duration, intensity, calories
  - Tip of the Day
  - Premium clinical UI with animations, glass morphism
- **Health Tab Card**: Mini-tabs Poids/Graisse/Muscle avec mini sparkline bars qui changent selon l'onglet selectionne
- **Testing**: 100% pass (iteration_93 backend 19/19 + iteration_94 frontend 100%)

### Suivi Quotidien (Daily Tracking) - Complete (March 2026)
- **Backend**: `POST /api/minceur/track`, `GET /api/minceur/today-tracking`
- **Frontend**: Validation buttons, progress bar, streak badge
- **Testing**: 100% pass (iteration_95)

### Allergies & Page Detail Repas - Complete (March 2026)
- **Testing**: 100% pass (iteration_96)

### Glycemie Estimee V1 — Complete (March 2026)
- **Backend** : Algorithme V1 base sur correlations scientifiques (HRV, FC repos, graisse viscerale, IMC, SpO2, sommeil, activite, age, conditions medicales)
- **Frontend** : Carte "Tendance Glycemique" sur la page Sante
- **Stockage ML-ready** : Toutes les calibrations horodatees
- **Testing** : Backend 3/3 endpoints OK

### Stripe-to-Mollie Migration — Complete (Feb 2026)
- Full payment provider migration from Stripe to Mollie
- Backend: contract_routes.py completely rewritten for Mollie
- Frontend: SubscriptionPage.tsx uses Mollie redirect flow
- Webhook handling for Mollie payment status
- Recurring subscription creation on first payment
- SAAD commission system stubbed (pending Mollie migration)
- Stripe code fully removed (no more import stripe, no STRIPE_CARE_ACCOUNT)
- **Testing**: 100% pass (iteration_102 — 17/17 backend)

### Calorie Data Coherence Fix — Complete (Feb 2026)
- `compute_daily_plan_async` in health_report_routes.py now checks `minceur_daily_cache` first
- If user has minceur recommendations (with goal), those calorie values are used
- Otherwise falls back to `basal_metabolism * 1.2`
- Water intake also aligned with minceur recommendations
- Ensures consistency across morning briefing, health page, and minceur page
- **Testing**: 100% pass (iteration_102)

### V6 Bracelet BLE Integration — Complete (Feb 2026)
- **Backend**: 
  - V6 BLE GATT config with 8 standard health services (heart_rate, blood_pressure, spo2, temperature, battery, device_info, ppg_custom, ecg_custom)
  - `POST /api/bracelet/v6/push` — accepts all data types (heart_rate, spo2, temperature, blood_pressure, ppg, ecg, steps, battery)
  - Consolidated readings for health report compatibility
  - Anomaly detection for V6 data
  - `GET /api/bracelet/v6/config` — BLE service UUIDs for frontend
  - `GET /api/bracelet/v6/ppg-history` — PPG data for ML glycemia
  - `GET /api/bracelet/v6/ecg-history` — ECG waveform data
- **Frontend**: 
  - Auto-detection of V6 vs 2208A by device name prefix
  - V6: Subscribes to standard GATT services (HR, SpO2, BP, temp, battery, PPG)
  - Real-time data parsing and display (HR, HRV from RR intervals, SpO2, BP, temp)
  - Enhanced vitals grid with HRV, SpO2, BP when available
  - Model indicator ("V6" shown in status card)
- **Testing**: 100% pass (iteration_102 — all V6 endpoints verified)

### Patent Documentation — Complete (Feb 2026)
- Full technical documentation at `/app/memory/PATENT_GLYCEMIA_V1.md`
- Covers: V1 algorithm, V2 calibration system, V3 ML architecture
- 3 revendications (method, system, ML extension)
- Scientific references for each correlation factor
- Implementation details and data collection architecture

### Password Persistence System — Complete
- File-based system (`password_overrides.json`) survives server/DB resets
- **Testing**: Verified

## Prioritized Backlog
### P0
- User verification of end-to-end Mollie payment flow (real payment test)
- Weekly Nora Report (push notification/summary)

### P1
- Guardian referral system
- Free 7-day trial
- V2 calibrated glycemia algorithm (with real finger-prick data)

### P2
- V3 ML glycemia (LSTM + Attention model)
- Correlations sante UI
- Contract PDF view
- Vivoo urine test integration
- Build natif iOS
- SAAD commission migration to Mollie

### Known Items for Future Polish
- Visuals for preparation steps in meal detail
- Swipe animation for goal setter
