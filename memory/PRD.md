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
    ├── subscription_routes.py
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

### Session 3 (Feb 2026)
- Fixed missing endpoints: /alerts/{id}/detail, /teleassistance/subscriber/{id}, /twilio/call/guardian
- Fixed logout: removed window.location.href hack, proper state-based navigation
- Conditional _layout.tsx navigation for auth/unauth

### Session 4 (Feb 11, 2026) - Current
- **Subscription Management System**:
  - Backend: subscription_routes.py with full CRUD, subscription check, Shopify sync/webhook endpoints
  - Subscription types: Standard (bracelet + app) and Care (Standard + teleassistance IA)
  - Bracelet sync requires active subscription (vest/scale don't)
  - Phone number used as linking field between Shopify orders and beneficiaries
  - Admin can create/update/delete subscriptions manually
  - Shopify webhook endpoint ready (POST /api/shopify/webhook/order-created)
  - Shopify manual sync endpoint (POST /api/admin/shopify/sync)
  - Phone normalization for French numbers
  - Demo seed: Robert Martin has Care subscription
- **Frontend Backoffice Updates**:
  - New "Abonnements" tab with subscription list, counters, CRUD
  - "Nouvel abonnement" modal with Standard/Care type selection
  - "Sync Shopify" button (green)
  - Stats page shows Abon. Standard and Abon. Care counts
  - Users list shows subscription badge
- **Testing**: 100% backend pass (14/14), frontend UI verified

## 3rd Party Integrations
- **Twilio**: Real phone calls for alert escalation
- **Shopify Admin API**: Subscription management via orders (requires SHOPIFY_ACCESS_TOKEN)
  - Store URL: b7at4t-4z.myshopify.com
  - Products: "Bracelet Elio" = Standard, "Care" = Care subscription

## Backlog
- Configure SHOPIFY_ACCESS_TOKEN when user obtains it (OAuth flow)
- Real email integration (currently mocked)
- Set up Shopify webhooks for automatic subscription creation on order
- LeFu Energy balance CF586BLE integration (waiting for AppKey/AppSecret from manufacturer)

## Hardware Integrations
- **S-AIRBAG Vest (CF586BLE)**: BLE integration complete
  - Frontend: vest-connect.tsx (Web Bluetooth API)
  - Backend: vest_routes.py (data ingestion, SOS alerts, sensor data storage)
  - Protocol: @&key=value&# format, 3 data types (normal, SOS/fault, sensors)
  - Auto-escalation on SOS detection via teleassistance
- **LeFu Energy Scale (CF586BLE+WiFi)**: Pending manufacturer API credentials
