# CHUTEX - Teleassistance & Telesante Application

## Problem Statement
Application de teleassistance et telesante "CHUTEX" pour le suivi des personnes agees/vulnerables avec 3 roles : beneficiaire, gardien, administrateur.

## Core Requirements
- **Beneficiaire**: Dashboard sante, alertes, teleconsultation, ECG, geofencing, alertes sedentarite
- **Gardien**: Suivi beneficiaires, interventions, prescriptions, itineraire vers beneficiaire
- **Admin**: Gestion codes prescripteurs/intervenants, KPI, statistiques
- **Teleassistance IA**: Plateforme de gestion des alertes avec escalade automatique

## Architecture
- **Frontend**: React Native / Expo / Expo Router (TypeScript)
- **Backend**: FastAPI (Python) - Structure modulaire
- **Database**: MongoDB
- **Auth**: JWT

### Backend Structure (Post-Refactoring)
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
    └── misc_routes.py
```

## Test Credentials
- Beneficiaire: robert.martin@email.fr / demo123
- Gardien: claire.martin@email.fr / demo123
- Admin: admin@chutex.fr / demo123
- Teleassistance: plateau@chutex.fr / demo123

## Implemented Features (Complete)
- Full auth (register/login/JWT)
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
- Single scrollable beneficiary detail page (no tabs)
- Alert detail page with timeline
- Subscriber detail page for teleassistance
- Smooth logout without page reload

## Mocked Integrations
- Email sending (logs to console)
- AI recommendations (uses Emergent LLM key when available)

## Session History

### Session 1 (Initial)
- Full app build with all core features
- Branding as CHUTEX
- Admin interface with tabs
- Teleassistance dashboard

### Session 2 (Feb 2026)
- P0: Refactored beneficiary detail to single scrollable page
- P1: Added "Lancer l'itineraire" for guardians
- P2: Enhanced backoffice CRUD for codes
- P3: Backend refactoring (monolithic -> modular)

### Session 3 (Feb 2026) - Current
- Fixed missing endpoints: /alerts/{id}/detail, /teleassistance/subscriber/{id}, /twilio/call/guardian
- Fixed logout: removed window.location.href hack, proper state-based navigation
- Conditional _layout.tsx navigation for auth/unauth

## Backlog
- P3: Real email integration (currently mocked)
