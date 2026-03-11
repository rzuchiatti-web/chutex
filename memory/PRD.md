# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Mollie (payments + commissions), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS)

## What's Been Implemented

### Payment System — Mollie (Complete)
- Full Stripe-to-Mollie migration
- SAAD Commission system via Mollie (onboarding, status, payment, webhook)

### Glycemia V2 Algorithm — Complete (Feb 2026)
- 12 weighted factors, 5 zones, estimated value in g/L
- Multi-calibration regression, sensor snapshots, trend analysis

### V6 Bracelet BLE — Complete (Feb 2026)
- Auto-detect by services (no name filtering)
- 8 GATT services, PPG/ECG data collection

### UI/UX Fixes — Mar 2026 (Latest)
- **Dashboard background**: Changed to dark medical/clinical CSS gradient (navy blues, no image)
- **Predictive notifications**: Now appear in the notification popup (bell icon, top-right). Dismiss button calls backend API. Red badge dot visible when alerts exist.
- **Exercise validation persistence**: Uses `useFocusEffect` from Expo Router to re-fetch tracking data on both `exercise-detail.tsx` and `activity-detail.tsx` pages.
- **Nora AI context**: Already enriched with weight goals, glycemia calibrations, sleep data, biological age, and recommendations.

### Previous UI/UX Fixes — Feb 2026
- **Seuils d'alerte medicaux**: SpO2 (92%), temperature (35.5-38.5C), FC (50-100bpm), HRV (20ms), stress (70/100)
- **Page glycemie redesignee**: 5 zones, valeur estimee en g/L, calibration card
- **Carte activite redesignee**: Titre centre, recuperation avec pourcentage
- **Objectif coucher visible**: Toujours affiche dans les objectifs journaliers

### All Previous Features (Complete)
- Dorsi Smart Cushion, i18n, VAPI Voice AI
- Poids & Nutrition, Daily Tracking, Allergies
- Health Dashboard, Password persistence, Morning briefing
- Calorie data coherence, Patent documentation
- Biological Age & Aging Rate simulation
- Sleep data simulation with hypnogram
- V6 Bracelet demo/simulation mode

## Prioritized Backlog
### P0
- True ML for Glycemia Estimation (V3 - enriched by other beneficiaries' data)
- Connect to Physical V6 Bracelet (BLE real device)

### P1
- Guardian referral system
- Free 7-day trial
- Meal preparation step images/icons (long pending)

### P2
- Slow page load optimization (Sleep, Activity, Glycemia detail pages)
- Health Correlations UI
- Contract PDF view
- Vivoo Urine Test Integration
- iOS build
- Technical documentation for glucose algorithm patent

## Test Credentials
| Role | Login | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian 1 | +33689896539 | test123 |
| Guardian 2 | +33619559380 | test123 |

## Simulated/Mocked Features
- Biological Age / Aging Rate
- Glycemia Estimation (V2 algorithm, not true ML)
- Sleep Data (hypnogram and detailed metrics)
- V6 Bracelet Data (Demo Mode)
