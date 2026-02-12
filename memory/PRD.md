# CHUTEX - Teleassistance & Telesante Application

## Problem Statement
Application de teleassistance et telesante "CHUTEX" pour le suivi des personnes agees/vulnerables avec 4 roles : beneficiaire, gardien, administrateur, teleassistance.

## Core Requirements
- **Beneficiaire**: Dashboard sante, alertes, teleconsultation, ECG, geofencing, alertes sedentarite
- **Gardien**: Suivi beneficiaires, interventions, prescriptions, itineraire vers beneficiaire
- **Admin**: Gestion codes prescripteurs/intervenants, KPI, statistiques
- **Teleassistance IA**: Plateforme de gestion des alertes avec escalade automatique

## Architecture
- **Frontend**: React Native / Expo / Expo Router (TypeScript)
- **Backend**: FastAPI (Python) - Structure modulaire
- **Database**: MongoDB
- **Auth**: JWT (email ou telephone)

### Backend Structure
```
/app/backend/
├── server.py          # App entry + seed data
├── database.py        # MongoDB connection & config
├── models.py          # Pydantic models
├── auth.py            # JWT auth utilities
├── utils.py           # Data generators, anomaly check, email mock
└── routes/
    ├── auth_routes.py
    ├── device_routes.py
    ├── health_routes.py
    ├── alert_routes.py
    ├── guardian_routes.py
    ├── admin_routes.py
    ├── teleassistance_routes.py
    ├── subscription_routes.py
    ├── vest_routes.py
    ├── bracelet_routes.py
    └── misc_routes.py
```

## Test Credentials
- Beneficiaire: robert.martin@email.fr / demo123
- Gardien: claire.martin@email.fr / demo123
- Admin: admin@chutex.fr / demo123
- Teleassistance: plateau@chutex.fr / demo123

## Implemented Features

### Core (Sessions 1-4)
- Full auth (register/login/JWT) with email + phone support
- Beneficiary dashboard with vitals, AI recommendations, reminders
- Guardian dashboard with beneficiary monitoring
- Alert system with create/resolve/escalation
- Teleconsultation questionnaire flow
- Prescription system with email notifications (MOCKED)
- Admin backoffice with full CRUD for codes (edit/toggle/delete)
- Teleassistance IA platform with auto-escalation
- ECG simulation and history
- Geofencing with zone violation detection
- Sedentarity alerts
- Data sharing preferences
- QR/Link code for guardian-beneficiary linking
- Guardian "Lancer l'itineraire" button
- Subscription management (Standard/Care) with Shopify sync endpoints

### Hardware Integrations
- S-AIRBAG Vest: BLE integration complete (Web Bluetooth API)
- J-Style 2208A Bracelet: Partially integrated (heart rate, temperature via BLE)
- Native BLE: react-native-ble-plx configured for EAS builds (untested)

### Session 5 (Feb 12, 2026) - UI/UX REDESIGN
- **Complete UI/UX Redesign**: Futuristic clinical theme inspired by Whoop + Withings
- **Dark/Light Mode**: Full theme system with user toggle (ThemeContext)
  - Default: Dark mode (deep navy #0B1120 background)
  - Light mode: Clean clinical white (#F0F4F8)
  - Cyan/Teal primary color (#22D3EE dark / #0891B2 light)
- **Redesigned Screens** (full theme support):
  - Login/Auth screen with animated logo, pill buttons, modern inputs
  - Beneficiary Dashboard: SOS pulse animation, device cards, vitals grid, AI card, quick actions
  - Guardian Dashboard: stats cards, beneficiary list, alert feed
  - Teleassistance Dashboard: live escalation cards, alert queue, subscriber list
  - Admin Dashboard: KPI grid, mini stats, backoffice link
  - Profile: user card, theme toggle switch, location sharing, guardians, shortcuts
  - Alerts: filter pills, severity badges, action buttons
  - Health: metric cards with icons, ECG/Sleep quick links
- **Partially themed screens** (background only): devices, teleconsult, backoffice, vest-connect, bracelet-connect, ecg, sleep, geofencing, health-detail, alert-detail, beneficiary-detail, subscriber-detail, intervention-detail, data-sharing, link-code, reminders, subscription
- **Testing**: 100% backend (17/17), 100% frontend - all 4 roles verified

## Design System
- Colors: `/app/frontend/src/constants/colors.ts` (LightTheme + DarkTheme)
- Theme: `/app/frontend/src/context/ThemeContext.tsx`
- Design guidelines: `/app/design_guidelines.json`

## 3rd Party Integrations
- **Twilio**: Phone calls for alert escalation
- **ElevenLabs**: AI voice generation (Sarah voice)
- **Shopify Admin API**: Subscription management (BLOCKED - plan limitation)

## Backlog / Next Tasks
- P0: Complete theme support for remaining secondary screens (devices, teleconsult, backoffice, etc.)
- P1: Guardian invitation frontend flow (backend ready, UI missing)
- P1: Finalize native Android build testing (Build #10 untested)
- P2: Complete J-Style bracelet data integration (SpO2, BP, battery, sleep/hypnogram)
- P3: iOS build (Apple Developer credentials needed)
- P3: Lefu Smart Scale integration (manufacturer API credentials pending)
- BLOCKED: Shopify full integration (user plan insufficient)

## Mocked
- Email sending (logs to console)
- Sleep hypnogram (simulated data pending native bracelet integration)
