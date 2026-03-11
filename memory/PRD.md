# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Mollie (payments + commissions), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS)

## What's Been Implemented

### Payment System — Mollie (Complete)
- Full Stripe-to-Mollie migration (contracts, subscriptions, webhooks)
- Recurring subscription creation on first payment
- SAAD Commission system via Mollie (onboarding, status, payment, webhook)
- Commission types: oneshot (100/200 EUR) or monthly (8/15 EUR) per plan

### SAAD Commission System — Complete (Feb 2026)
- `POST /api/saad/onboarding` — Register SAAD with IBAN, commission_type (oneshot/monthly)
- `GET /api/saad/status/{saad_id}` — Registered status, earnings, pending amounts
- `POST /api/mollie/webhook-commission` — Webhook for commission payment status
- `GET /api/admin/saad-commissions` — Admin overview with paid/pending/total
- Auto-triggered when prescribed contract is activated
- Legacy routes (`/api/saad/stripe-*`) redirect to new endpoints

### Glycemia Estimation V2 — Complete (Feb 2026)
- **12 weighted factors**: HRV (18%), visceral fat (16%), HR rest (12%), BMI (8%), body fat (8%), muscle-to-fat ratio (6%), SpO2 (6%), sleep (6%), activity (5%), temperature deviation (4%), age (5%), medical conditions (6%)
- **5 zones**: normal, normal_high, vigilance, pre_alert, alert
- **Estimated glycemia value** in g/L (not just zone)
- **Multi-calibration regression**: time-weighted offsets from all calibrations (not just latest)
- **Calibration quality**: none/low/medium/high based on count
- **Sensor snapshots**: Each calibration captures current bracelet + scale data for future ML
- **Trend analysis**: GET /api/glycemia/trend tracks improving/stable/worsening
- **Personalized confidence**: based on data completeness + calibration quality

### V6 Bracelet BLE Integration — Complete (Feb 2026)
- Backend: 8 GATT services (HR, BP, SpO2, temp, battery, device_info, PPG, ECG)
- Frontend: **Auto-detect by available services** (no name filtering)
- Tries standard GATT Heart Rate first → if found, subscribes to all standard services
- Fallback to 2208A proprietary protocol if no standard services
- PPG waveform data collection for future ML glycemia
- Real-time vitals: HR, HRV (from RR intervals), SpO2, BP, temperature

### All Previous Features (Complete)
- Dorsi Smart Cushion, i18n, VAPI Voice AI
- Poids & Nutrition (Weight & Nutrition) with daily tracking
- Allergies & Meal Detail, Exercise Detail
- Health Dashboard redesign
- Password persistence system
- Morning briefing, Weekly Nora report
- Calorie data coherence fix

## Prioritized Backlog
### P0
- User verification of end-to-end Mollie payment flow
- Demo/simulation mode for V6 bracelet (requested by user)

### P1
- Guardian referral system
- Free 7-day trial

### P2
- V3 ML glycemia (LSTM + Attention model)
- Correlations sante UI
- Contract PDF, Vivoo, build iOS natif
- Visuals for meal preparation steps
