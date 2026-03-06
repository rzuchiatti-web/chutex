# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API)

## What's Been Implemented

### Dorsi Smart Cushion — Full CDC Integration (March 2026)

#### BLE Communication (HeloKine01)
- **Web Bluetooth API** integration via `useDorsiBLE` hook
- Device name: "HeloKine01", scans via `namePrefix: 'HeloKine'`
- Angular Service UUID: `00001101-0000-1000-8000-00805f9b34fb`
- Characteristics: angleX (`00002101`), angleY (`00002102`), angleZ (`00002103`)
- Data format: UTF-8 string in degrees (e.g. "45.1")
- Battery Service: standard BLE 0x180F
- Auto fallback to simulation mode when no device connected

#### Bilan (Assessment)
- Multi-step guided flow: introduction → BLE connect → gyroscope taring → 4 direction measurements → pain sliders → radar chart (Kiviat)
- Measures real angles from BLE (0-45° → 0-100% mobility) or simulated
- 4 directions: Anteversion, Retroversion, Flexion gauche, Flexion droite
- Pain scale 1-10 per direction
- Bilans and games are **DECOUPLED** from program — accessible at any time

#### 3 Mini-Games (CDC Spec)
1. **Jeu des Moutons** (Mobilite) — Catch sheep by tilting pelvis toward weak mobility zones
2. **Bulles de Savon** (Endurance) — Pop bubbles at edges of maximal mobility
3. **Equilibre Proprioceptif** (Proprioception) — Stabilize ball at center via balance
- All games use real BLE angles or keyboard/touch fallback
- Canvas-based rendering at 60fps
- "Jeux libres" section for free play without program

#### 10-Day Program
- Generated from bilan results, 2 sessions/day of 10 min
- Reassessment days 3, 6, 9
- Multiple programs allowed (old ones marked 'replaced')
- Progress tracking with day advancement

### Previous Implementations
- VAPI Voice AI SOS, Alert escalation, SAAD intervention
- Bracelet Elio, Balance Vita, Gilet Elder devices
- Health dashboard, Nora AI morning briefing
- Subscription/payment, RGPD, Admin backoffice
- i18n (7 languages)

## Key Files
- `/app/frontend/src/hooks/useDorsiBLE.ts` — Web Bluetooth API hook
- `/app/frontend/app/dorsi-bilan.tsx` — Bilan assessment with BLE
- `/app/frontend/app/dorsi-program.tsx` — Program + 3 CDC mini-games
- `/app/backend/routes/dorsi_routes.py` — Dorsi API endpoints
- `/app/frontend/src/components/devices/constants.ts` — Device metadata

## Prioritized Backlog

### P1 (High)
- Nora AI recommends exercises based on bilan
- Guardian Referral System
- Free 7-Day Trial

### P2 (Medium)
- Contract PDF viewer
- Vivoo Urine Test Integration
- ElevenLabs voice cloning for VAPI
- Vest badge color fix (orange not green)
- Refactor alerts.tsx into smaller components

### P3 (Low/Future)
- Real HeloKine01 device testing
- Game difficulty adaptation based on progress
- Leaderboard/social features

## Test Credentials
| Role | Login | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian | +33771149910 | test123 |
| SAAD Agent | sophie@saad-loire.com | test123 |

## Guardian: Myriam YSSARTEL (+33771149910) — linked to Josette Zuchiatti
