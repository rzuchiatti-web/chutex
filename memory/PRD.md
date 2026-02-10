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

## Implemented Features
- Full auth (register/login/JWT)
- Beneficiary dashboard with vitals, AI recommendations, reminders
- Guardian dashboard with beneficiary monitoring
- Alert system with create/resolve/escalation
- Teleconsultation questionnaire flow
- Prescription system with email notifications (MOCKED)
- Admin backoffice with full CRUD for codes
- Teleassistance IA platform with auto-escalation
- ECG simulation and history
- Geofencing with zone violation detection
- Sedentarity alerts
- Data sharing preferences
- QR/Link code for guardian-beneficiary linking

## Mocked Integrations
- Email sending (logs to console)
- AI recommendations (uses Emergent LLM key when available)
- Twilio calls (configured but optional)

## Completed This Session (Feb 2026)
1. P0 - Refactored guardian's beneficiary detail page (single scrollable page)
2. P1 - Added "Lancer l'itineraire" button for guardians
3. P2 - Enhanced backoffice CRUD (edit/toggle/delete) for activation & intervention codes
4. P2 - "Cloturer" button on alert cards (already existed)
5. P3 - Complete backend refactoring from monolithic server.py to modular structure

## Backlog
- P2: Fix logout workaround (currently uses page reload)
- P3: Real email integration (currently mocked)
- P3: Persistent database setup (currently resets on restart but uses MongoDB)
