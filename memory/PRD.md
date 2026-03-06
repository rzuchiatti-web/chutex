# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices (bracelet, scale, vest), AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API)

## What's Been Implemented

### Dorsi Smart Cushion Integration (March 2026) - DONE
- **Device & Pairing**: Added "Coussin Dorsi" as a pairable device with simulated Bluetooth connection
- **Bilan (Assessment)**: Multi-step guided flow with:
  - Introduction with posture instructions
  - Gyroscope taring/calibration simulation
  - 4-direction mobility measurement (forward/backward/left/right) with simulated gyroscope
  - Pain level sliders (0-10) for each direction
  - 4-point radar chart (Kiviat diagram) showing mobility and pain results
- **10-Day Program**: Generated from bilan results with:
  - 2 sessions per day (10 min each)
  - Reassessment on days 3, 6, 9
  - Progress tracking and day advancement
- **3 Mini-Games**:
  - Esquive Lombaire (Dodge): Dodge falling balls using left/right pelvic tilts
  - Equilibre Dorsal (Balance): Keep ball on target in circular arena using 4-direction input
  - Cible Posturale (Target): Match direction prompts by pressing correct arrow

### Previous Implementations (Pre-Dorsi)
- VAPI Voice AI SOS call system
- Alert escalation flow with SAAD intervention
- Bracelet Elio, Balance Vita, Gilet Elder device management
- Health dashboard with vitals monitoring
- Internationalization (7 languages: FR, EN, DE, ES, IT, PT, NL)
- Nora AI morning briefing
- Subscription/payment system
- RGPD compliance
- Admin backoffice

## Key Files
- `/app/backend/routes/dorsi_routes.py` - Dorsi API endpoints
- `/app/frontend/app/dorsi-bilan.tsx` - Bilan assessment page
- `/app/frontend/app/dorsi-program.tsx` - Program with 3 mini-games
- `/app/frontend/src/components/devices/constants.ts` - Device metadata including Dorsi
- `/app/frontend/src/components/devices/DeviceCard.tsx` - Dorsi card with Bilan button

## API Endpoints (Dorsi)
- `POST /api/devices/associate` (device_type=dorsi) - Pair device
- `POST /api/dorsi/bilan` - Create mobility assessment
- `GET /api/dorsi/bilans` - List all assessments
- `GET /api/dorsi/bilan/{id}` - Get specific assessment
- `POST /api/dorsi/program` - Generate 10-day program
- `GET /api/dorsi/programs` - List programs
- `GET /api/dorsi/program/{id}` - Get specific program
- `PUT /api/dorsi/program/{id}/session` - Complete a game session
- `PUT /api/dorsi/program/{id}/reassessment` - Submit reassessment

## DB Collections
- `dorsi_bilans`: Stores mobility assessments with 4-direction measurements
- `dorsi_programs`: Stores 10-day exercise programs with sessions and scores

## Prioritized Backlog

### P0 (Critical)
- None currently

### P1 (High)
- Nora AI recommending exercises based on bilan results
- Guardian Referral System
- Free 7-Day Trial

### P2 (Medium)
- View Contract PDF functionality
- Vivoo Urine Test Integration
- ElevenLabs voice cloning for VAPI
- Vest "standby" badge should be orange not green (minor UI fix)
- Refactor alerts.tsx (>900 lines) into smaller components

### P3 (Low/Future)
- Real Bluetooth device connection for Dorsi cushion
- More mini-game variety
- Leaderboard/social features for games

## Test Credentials
| Role | Email/Phone | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian | +33630686585 | test123 |
| SAAD Agent | sophie@saad-loire.com | test123 |
