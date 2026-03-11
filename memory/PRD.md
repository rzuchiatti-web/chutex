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

### UI/UX Fixes — Feb 2026 (Latest)
- **Seuils d'alerte medicaux**: SpO2 (92%), temperature (35.5-38.5°C), FC (50-100bpm), HRV (20ms), stress (70/100) — suggestions coherentes par metrique
- **Page glycemie redesignee**: Texte blanc lisible, 5 zones affichees, valeur estimee en g/L, analyse Nora visible, carte calibration avec explication "1x/mois" et selecteur contexte (a jeun/apres repas), bouton responsive
- **Carte activite redesignee**: Titre centre "Activite Physique", recuperation avec pourcentage + label + barre gradient
- **Marketing temps precis**: Heure de coucher 22:34 (pas 22:30) — impression sur-mesure
- **Objectif coucher visible**: Toujours affiche dans les objectifs journaliers (pas filtre quand sleep_quality=0)

### All Previous Features (Complete)
- Dorsi Smart Cushion, i18n, VAPI Voice AI
- Poids & Nutrition, Daily Tracking, Allergies
- Health Dashboard, Password persistence, Morning briefing
- Calorie data coherence, Patent documentation

## Prioritized Backlog
### P0
- User verification end-to-end Mollie payment
- Demo/simulation mode V6 bracelet

### P1
- Guardian referral system, Free 7-day trial

### P2
- V3 ML glycemia, Correlations sante, Contract PDF, Vivoo, iOS build
