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

### Session Mar 11 2026 — UI Updates

#### Batch 1 (from fork handoff)
- **Dashboard gradient background**: Dark medical/clinical CSS gradient (navy blues)
- **Predictive notifications in popup**: Alerts now appear in bell notification popup with dismiss button
- **Exercise validation persistence**: `useFocusEffect` on exercise-detail and activity-detail pages
- **Nora AI context**: Verified enriched with weight goals, glycemia, sleep, biological age

#### Batch 2 (current user request)
- **Device page buttons**: ECG, Nouvelle pesée, Bilan lombaire — white text, NO icons, transparent border
- **WeighingFlow step 1**: Balance VITA SVG image replaces old icon
- **Dorsi bilan intro**: Added posture instructions (dos droit, pas collé au dossier, bassin pas épaules)
- **Dorsi bilan measurement steps**: Movement illustration images for each direction + detailed posture reminders
- **Dorsi bilan results**: Two separate radar charts (current vs previous) with comparison metrics highlighted

### Previous UI/UX Fixes — Feb 2026
- Seuils d'alerte medicaux, page glycemie redesignee, carte activite redesignee
- Objectif coucher visible, marketing temps precis

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
