# CARE WATCH - PRD

## Original Problem Statement
CARE WATCH is an AI tele-assistance platform for elderly care. The app serves multiple roles: Beneficiaries (elderly users), Guardians (family/professional caregivers), SAADs (home care service providers), Teleassistance operators, Intervenants, Prescribers, and Admins.

## Core Features Implemented
- Multi-role authentication with role switching
- Beneficiary-Guardian linking via phone number invitation
- SAAD management hub with member and agency management
- Real-time health monitoring via connected devices (Bracelet, Scale, Vest)
- SOS alert system with teleassistance integration
- Intervention management with map routing
- Teleconsultation with AI doctor
- Prescription management
- Geofencing and reminders
- ECG monitoring and sleep tracking

## Architecture
- Frontend: Expo/React Native (Web + iOS)
- Backend: FastAPI + MongoDB
- Integrations: OpenAI (via Emergent LLM), ElevenLabs TTS, Lefu Scale BLE, Expo EAS

## What's Been Implemented (Latest Session - Feb 19, 2026)

### Beneficiary Dashboard Redesign (COMPLETE)
- Complete redesign with dark blue/teal silk background
- 4 vital sign cards (BPM, SpO2, Tension, Temperature)
- 3 connected device cards (Bracelet Elio, Balance Lefu, Gilet CareWatch) with battery levels
- Activity tracking (steps, calories, distance) with progress bars
- Sleep summary (duration, quality, phases)
- SOS button with gradient styling
- Quick action buttons (ECG, Zones, Rappels, Teleconsult)
- Guardian management section with invite popup
- Alert banner with dynamic status

### Health Page Redesign (COMPLETE)
- Same dark blue/teal silk background for design coherence
- Organized by device sections with colored dividers:
  - BRACELET ELIO: 4 vitals + heart rate history chart + activity tracking
  - BALANCE LEFU: Weight + BMI + full body composition (6 metrics) + weight history chart
  - GILET CAREWATCH: Posture score + fall detection + vest details
  - SOMMEIL: Duration, quality %, sleep phase breakdown
- Quick navigation actions at bottom

### New Backend Endpoint
- `GET /api/devices/dashboard-summary`: Comprehensive simulated data for all 3 devices + sleep when no real hardware connected

## Data Simulation (MOCKED)
All device data is simulated for demo purposes when no real hardware is connected:
- Bracelet: HR, SpO2, BP, temp, steps, calories, distance, HR history
- Scale: weight, BMI, body fat, muscle mass, water %, bone mass, visceral fat, metabolic age, weight history
- Vest: posture score, fall detection, chest temp, wearing hours, impacts
- Sleep: duration, quality, deep/light/REM phases, bedtime/wakeup times
- SMS invitations are mocked via console logs

## Pending Issues
- P1: Lefu Scale BLE data parsing (native iOS only)
- P2: Network Request Failed on native TestFlight app (backend URL expires)
- P0/RESOLVED: Guardian dashboard text color issue (was cache-related)

## Upcoming Tasks
- P1: App-wide coherence check across all roles and pages
- P1: Deploy backend to permanent host
- P2: Native Build + J-Style bracelet BLE integration
- P3: Shopify integration (blocked on user)
- P4: Offline mode for intervenants

## Refactoring Needed
- teleconsult.tsx: Too large and fragile, needs component breakdown
- index.tsx: Serves 3+ roles, could benefit from separation

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| SAAD | saad@chutex.fr | demo123 |
