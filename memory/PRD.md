# Chutex Care - PRD

## Problem Statement
Chutex Care is a sophisticated preventative health and teleassistance application. The core mission is to transform the app into a guided, engaging, and personalized health and longevity transformation engine for elderly beneficiaries, with a complete SOS alert chain and professional care intervention system.

## Architecture
- **Frontend**: Expo React Native (web + mobile), served via Metro bundler
- **Backend**: FastAPI + MongoDB (motor async)
- **AI**: GPT-5.2 via Emergent LLM Key, VAPI.ai voice AI
- **Payments**: Stripe
- **SMS**: SMSMode, Twilio (for calls)
- **Email**: Mailjet
- **Voice**: ElevenLabs, Azure TTS

## Core Features Implemented

### SOS Alert & Teleassistance Chain (COMPLETE)
1. Beneficiary triggers SOS alert
2. VAPI AI calls beneficiary (GPT-4o + ElevenLabs voice)
3. If beneficiary is OK → Alert auto-resolved
4. If beneficiary needs help OR no response → AI calls guardians in cascade
5. If no guardian responds → Dispatch to nearest SAAD agency (geolocation-based)
6. SAAD guardian sees mission in app → Accepts → Tracks to beneficiary

### Programs Feature (COMPLETE)
- 10 programs with 573+ guided tasks
- Dynamic personalization by Nora AI based on health profile
- Task progress tracked via index-based IDs

### Device Integration
- Smart bracelet (heart rate, SpO2, steps, temperature)
- Smart scale (weight, body composition via Lefu API)
- Anti-fall vest
- Activity tracking and recovery scores

### User Roles
- **Beneficiary**: Health dashboard, SOS alerts, programs
- **Guardian (Family)**: Monitor beneficiaries, receive alerts, intervene
- **Guardian (Professional/SAAD)**: Accept care intervention missions
- **SAAD Company (prescriber_company)**: Manage agencies, guardians, prescriptions
- **Teleassistance**: Manual escalation, monitoring
- **Admin**: System management

## Test Accounts (as of Feb 2026)

| Role | Login | Password | Notes |
|---|---|---|---|
| Beneficiary | 0651245918 | test123 | Josette Zuchiatti, Saint-Chamond |
| Guardian (Fils) | 0630686585 | test123 | Franck ZUCHIATTI |
| Guardian (Fille) | 0612345678 | test123 | Claire Martin |
| Guardian (Voisin) | 0698765432 | test123 | Pierre Durand |
| SAAD1 Guardian | 0611223344 | test123 | Sophie MARTIN (Agence Saint-Chamond) |
| SAAD1 Guardian | 0605221196 | test123 | Fabrice COMMEAT (Agence Lyon) |
| SAAD2 Guardian | 0655667788 | test123 | Laurent DUBOIS (Agence Saint-Etienne) |
| SAAD1 Admin | saad@aide-domicile.fr | test123 | SAAD Aide a Domicile Loire |
| SAAD2 Admin | saad2@steti-centre.fr | test123 | SAAD Saint-Etienne Centre |

## Key API Endpoints

### Alerts
- `POST /api/alerts` - Create SOS alert (triggers VAPI orchestration)
- `GET /api/alerts` - List alerts
- `GET /api/alerts/active-with-interventions` - Active alerts with intervention data
- `GET /api/alerts/{id}/detail` - Full alert detail with timeline

### Interventions
- `GET /api/interventions/pending` - Pending interventions (includes SAAD-dispatched via company_id/agency_id)
- `POST /api/intervention/accept` - Accept an intervention
- `GET /api/intervention/{id}` - Intervention detail
- `POST /api/intervention/close` - Close with QCM report
- `POST /api/interventions/accept-as-guardian` - Guardian accepts directly

### Programs
- `GET /api/programs/active` - Active program with Nora-personalized tasks
- `POST /api/programs/save-task` - Save task progress

## P0 Backlog (Next)
- [ ] Vivoo urine test integration (awaiting distributor SDK feedback)
- [ ] VAPI voice quality improvement (ElevenLabs voice cloning)

## P1 Backlog
- [ ] Guardian referral system
- [ ] Free 7-day trial program
- [ ] View contract PDF from subscription page
- [ ] Vest status badge color (standby should be orange, not green)

## P2 Backlog
- [ ] Refactor VAPI logic from alert_routes.py into dedicated vapi_service.py
- [ ] Production Twilio number for French calls
