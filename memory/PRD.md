# Chutex Care - PRD

## Problem Statement
Chutex Care is a sophisticated preventative health and teleassistance application for elderly beneficiaries, with a complete SOS alert chain and professional care intervention system.

## Architecture
- **Frontend**: Expo React Native (web + mobile)
- **Backend**: FastAPI + MongoDB
- **AI**: GPT-5.2/4o-mini via Emergent LLM Key, VAPI.ai voice AI
- **Payments**: Stripe
- **SMS**: SMSMode, Twilio
- **Voice**: ElevenLabs (Delphine), VAPI.ai

## Completed Features

### SOS Alert Chain (COMPLETE)
- Beneficiary triggers SOS → VAPI AI calls (Nora/Delphine voice) → Guardian cascade → SAAD dispatch
- Alert auto-resolved when patient confirms OK (status + resolved_at + resolved_by)
- Call report (Rapport de Nora) with integrated audio player in alert detail
- Geolocation-based SAAD agency dispatch (haversine distance + radius)
- 10min timeout for patient calls, 3-retry analysis fetch

### SAAD Intervention System (COMPLETE)
- `/api/interventions/pending` matches by company_id/agency_id for SAAD guardians
- Accept/decline missions, QCM closure report, intervention tracking
- Test accounts: 2 SAAD structures with agencies and guardians

### Alert Detail UI (COMPLETE)
- Unified view (alert-detail.tsx redirects to alerts tab)
- Glass blur on all cards, icons on info grid + timeline
- Rapport de Nora with audio player, badges, call summary
- Translated in 7 languages (FR/EN/DE/ES/IT/PT/NL)

### Programs (COMPLETE)
- 10 programs, 573+ guided tasks, Nora AI personalization

### i18n (IN PROGRESS)
- 7 languages with ~90 keys per language
- Applied on alerts page, partially on dashboard

## Test Accounts (password: test123)
| Role | Login |
|---|---|
| Beneficiary | 0651245918 (Josette) |
| Guardian (Fils) | 0630686585 (Franck) |
| Guardian (Fille) | 0612345678 (Claire) |
| SAAD1 Guardian | 0611223344 (Sophie) |
| SAAD1 Guardian | 0605221196 (Fabrice) |
| SAAD2 Guardian | 0655667788 (Laurent) |
| SAAD1 Admin | saad@aide-domicile.fr |
| SAAD2 Admin | saad2@steti-centre.fr |

## P0 - Coussin Dorsi Integration (NEXT)
New kinesiotherapy device: air cushion with BLE accelerometer/gyroscope

### Device Specs
- Name: "HeloKine01", BLE communication
- BLE Service UUID: 00001101-0000-1000-8000-00805f9b34fb
- Characteristic UUIDs: angleX=00002101, angleY=00002102, angleZ=00002103
- Data format: UTF-8 String (degrees), e.g. "45.1"
- Wake: double-tap accelerometer, sleep after 1min no connection

### Features to Build
1. **Device Connection** - BLE scan + pair (simulated for now), add to devices page
2. **Mobility Assessment (Bilan)** - Guided step-by-step:
   - Calibration (tare sensor)
   - 4 cardinal directions: Anteversion, Retroversion, Right flexion, Left flexion
   - Pain level 1-10 for each direction
   - Radar/Kiviat chart visualization
3. **3 Mini-Games** (ludic exercises using pelvic tilt):
   - Ball Dodge: tilt pelvis to dodge falling balls
   - Bubble Pop: pop soap bubbles at max mobility range
   - Balance Path: navigate a path by tilting
4. **10-Day Program** - 2 sessions/day, 10 min each
   - Reassessment every 3 days
   - Adapt exercises based on progress
5. **Exercise Types**: Mobility, Proprioception, Deep muscle strengthening, Body awareness
6. **Progress Dashboard**: Radar chart evolution, streaks, pain tracking

### Backend Endpoints
- POST /api/dorsi/assessment - Save assessment
- GET /api/dorsi/assessments - History
- GET /api/dorsi/program - Current program
- POST /api/dorsi/session - Save game session

## P1 Backlog
- Complete i18n on all screens
- Vivoo urine test integration
- VAPI voice cloning
- SAAD escalation end-to-end testing

## P2 Backlog
- Guardian referral system
- Free 7-day trial
- Contract PDF viewer
- Vest badge color fix
- Refactor VAPI into vapi_service.py

## Key Files
- `backend/services/vapi_engine.py` - VAPI orchestration (timeout 600s, 3-retry analysis)
- `frontend/app/(tabs)/alerts.tsx` - Unified alert detail with ResolvedSection
- `frontend/src/context/I18nContext.tsx` - 7-language i18n (FR/EN/DE/ES/IT/PT/NL)
- `backend/routes/teleassistance_routes.py` - Interventions pending (SAAD matching)
- `backend/routes/alert_routes.py` - Alert creation, SAAD dispatch
