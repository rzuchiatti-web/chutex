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

## Completed Features (Feb-Mar 2026)

### SOS Alert Chain (COMPLETE)
- Beneficiary triggers SOS → VAPI AI calls (Nora) → Guardian cascade → SAAD dispatch
- Alert auto-resolved when patient confirms OK
- Call report (Rapport de Nora) with audio recording in alert detail
- Geolocation-based SAAD agency dispatch

### SAAD Intervention System (COMPLETE)  
- SAAD guardians see pending missions via company_id/agency_id matching
- Accept/decline missions, QCM closure report
- Test accounts: 2 SAAD structures, agencies, guardians

### Programs (COMPLETE)
- 10 programs, 573+ guided tasks, Nora personalization

### i18n (IN PROGRESS)
- 7 languages: FR, EN, DE, ES, IT, PT, NL
- ~90 keys per language, applied on alerts page

### UI Improvements (COMPLETE)
- Unified alert detail view (no more duplicates)
- Glass blur on all cards
- Icons on info grid and timeline
- Audio player for call recordings
- alert-detail.tsx redirects to alerts tab

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

## P0 Backlog - Coussin Dorsi Integration
New kinesiotherapy device: air cushion with BLE gyroscope/accelerometer
- **Device**: "HeloKine01", BLE communication, angles X/Y/Z via UUIDs
- **Assessment**: 4 cardinal directions (anteversion, retroversion, flexion D/G) + pain (1-10)
- **Radar Chart**: Kiviat diagram showing mobility + pain evolution
- **3 Mini-Games**: Ludic exercises using pelvic tilt (dodge balls, etc.)
- **10-Day Program**: 2 sessions/day, 10 min, reassessment every 3 days
- **BLE UUIDs**: angleX=00002101, angleY=00002102, angleZ=00002103

## P1 Backlog
- Complete i18n application (dashboard, guardian home)
- Vivoo urine test integration
- VAPI voice cloning (ElevenLabs)
- Full SAAD escalation end-to-end testing

## P2 Backlog
- Guardian referral system
- Free 7-day trial
- Contract PDF viewer
- Vest badge color fix (standby → orange)
- Refactor VAPI logic into vapi_service.py
