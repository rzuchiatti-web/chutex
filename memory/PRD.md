# VitalLink - Product Requirements Document

## Problem Statement
Application de monitoring santé et téléassistance automatisée. Permet le suivi de données de santé simulées, la gestion de prescriptions, la liaison gardien/bénéficiaire, et un protocole de téléassistance entièrement automatisé via Twilio.

## Tech Stack
- **Frontend**: React Native (Expo) for Web, TypeScript
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM Key (recommendations, health reports)
- **Telephony**: Twilio Voice API (real automated calls)

## User Roles
1. **Bénéficiaire**: Patient monitored (demo@vitallink.fr / demo123)
2. **Gardien**: Family/caregiver guardian (guardian@vitallink.fr / demo123)
3. **Téléassistance**: Operator monitoring alerts (teleassist@vitallink.fr / demo123)
4. **Admin**: Back-office administrator (admin@vitallink.fr / demo123)

## Core Features - IMPLEMENTED
- [x] Multi-role authentication (JWT)
- [x] Clinical black-and-white UI design
- [x] Beneficiary health dashboard with simulated data (bracelet, scale, vest)
- [x] AI-powered health recommendations (GPT-5.2)
- [x] Alert system (SOS, fall detection, anomaly)
- [x] Fully automated teleassistance escalation protocol (Twilio)
- [x] Guardian-beneficiary linking (email + QR code)
- [x] Prescription management with commissions
- [x] Admin backoffice (stats, users, codes, prescriptions, interventions)
- [x] Intervention provider role activation via codes
- [x] UberEats-style intervention tracking (map + ETA + progress steps)
- [x] Comprehensive beneficiary detail for guardians (health, alerts, AI report)
- [x] Alert detail with escalation timeline and call logs
- [x] Real-time auto-refresh on teleconsult dashboard (5s polling)
- [x] Auto-refresh on alert detail and intervention detail
- [x] Health metric detail with charts, thresholds, and AI advice
- [x] Seed data on startup

## Architecture
```
Frontend: React Native (Expo) - Port 3000
Backend: FastAPI - Port 8001
Database: MongoDB (localhost:27017, DB: vitallink_db)
```

## Key Screens
- Auth (login/register)
- Home dashboard (role-specific)
- Health data (bracelet/scale tabs)
- Alerts (with test triggers)
- Devices (sync simulation)
- Profile (with role-specific features)
- Backoffice (admin only)
- Beneficiary detail (guardian view)
- Alert detail (with escalation tracking)
- Intervention detail (UberEats-style tracking)
- Link code (QR sharing)

## Mocked Features
- Email sending (simulated, stored in DB)
- Health data (simulated via device sync)

## Future/Backlog
- P1: Real email sending (Twilio SendGrid integration)
- P2: Enhanced Guardian Dashboard PDF export
- P3: SMS notifications
- P3: Backend refactoring (split server.py into modules)
