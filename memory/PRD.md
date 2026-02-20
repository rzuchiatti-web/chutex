# CARE WATCH / Chutex - Product Requirements Document

## Original Problem Statement
Full-stack health monitoring platform (React Native Expo + FastAPI + MongoDB) for elderly care. Features include:
- Phone-based login/registration with role-specific multi-step onboarding
- Beneficiary & Guardian dashboards with customizable backgrounds and KPIs
- "Coach Santé Intelligent" - AI Health Coach analyzing 74+ health metrics from smart bracelet/scale
- Alert management, device monitoring, reminders system
- Multi-role architecture: Beneficiary, Guardian, Intervenant, Teleassistance, Admin, SAAD

## Architecture
- **Frontend**: React Native (Expo) with web support, file-based routing (expo-router)
- **Backend**: FastAPI, Python
- **Database**: MongoDB (vitallink_db)
- **AI**: OpenAI GPT-4.1-mini via Emergent LLM Key
- **Key**: EMERGENT_LLM_KEY for AI health analysis

## Core Files
- `frontend/app/(tabs)/index.tsx` - Main dashboard (Beneficiary + Guardian)
- `frontend/app/(tabs)/health.tsx` - Health Coach page
- `frontend/app/register.tsx` - Multi-step registration
- `frontend/app/login.tsx` - Phone-based login
- `frontend/app/metric-detail.tsx` - Metric detail with custom charts
- `frontend/app/health-detail.tsx` - Thematic health sections
- `frontend/app/(tabs)/profile.tsx` - Profile page
- `frontend/src/components/PastelMistBackground.tsx` - Global styles/background
- `backend/routes/health_report_routes.py` - AI health analysis + summary endpoints
- `backend/routes/health_routes.py` - Health metrics, thresholds
- `backend/routes/auth_routes.py` - Auth, role switching, guardian activation

## What's Been Implemented

### Session 1 (Previous)
- Complete Coach Santé Intelligent (LLM analysis of 74+ metrics)
- Login/Registration overhaul (phone-based, glassmorphism, medical questionnaire)
- Beneficiary dashboard & reminders refactor
- Alert thresholds management
- Profile page medical editor
- "Comment avez-vous connu Chutex?" in registration

### Session 2 (Current - Feb 20, 2026)
- **NEW: Dashboard Header Redesign** (P0 - COMPLETED ✅)
  - AI-generated health summary card with score badge (via new `/api/health/summary` endpoint)
  - Language selector (FR/EN/DE/ES/IT) - pure web implementation
  - Segmented control tabs: Bénéficiaire / Aidant
  - Guardian activation popup (2 steps: features presentation + SMS/Email alert config)
  - Fixed CSS display:none bug in PastelMistBackground.tsx
- **NEW: `/api/health/summary` endpoint** - Lightweight LLM-powered health summary with 1-hour cache

## Key API Endpoints
- `POST /api/auth/login` - Phone/email login
- `POST /api/auth/register` - Multi-step registration
- `POST /api/auth/switch-role` - Switch between beneficiary/guardian
- `POST /api/auth/activate-guardian` - Activate guardian space
- `GET /api/health/summary` - AI health summary (NEW)
- `GET /api/health/daily-report` - Full daily health report with AI
- `GET /api/health/metric-history/{key}` - 30-day metric history

## DB Schema (Key Collections)
- **users**: Expanded with medical fields, guardian_type, alert_sms, alert_email
- **thresholds**: user_id, metric_key, low/high threshold
- **health_summary_cache**: user_id, summary, recommendation, score, status, generated_at (1h TTL)

## Test Credentials
| Role | Email | Password | Phone |
|---|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 | +33651245918 |
| Guardian | claire.martin@email.fr | demo123 | +33630686585 |
| Intervenant | ludivine.moutio@care.fr | demo123 | |
| Teleassistance | plateau@chutex.fr | demo123 | |
| Admin | admin@chutex.fr | demo123 | |

## Prioritized Backlog

### P0 (Completed)
- ✅ Dashboard header redesign

### P1 (Next)
- Device connection tutorial on beneficiary dashboard
- Lefu Scale BLE data parsing fix

### P2
- App-wide design/data coherence check
- Network Request Failed on native app (permanent backend URL)
- Native build & BLE integration for J-Style bracelet

### P3
- Shopify integration (blocked on user)
- Offline mode for intervenants
- Deploy backend to permanent host

## Known Issues
- Lefu Scale live data parsing incorrect (only weight works)
- Native app "Network Request Failed" (preview URL expires)
- SMS for forgot password is MOCKED
- Metro cache often needs clearing for UI changes

## Critical Dev Notes
- **LANGUAGE**: All user communication must be in French
- **CSS BUG**: `PastelMistBackground.tsx` line 470 had a CSS rule `[data-testid*="header"] { display: none !important }` that was hiding custom header elements. Fixed by removing the data-testid selector.
- **COMPONENT SCOPE**: Never define React components inside render functions (causes focus-loss bug)
- **METRO CACHE**: Always clear cache after significant changes: `rm -rf .metro-cache && supervisorctl restart expo`
- **React Native Web**: `display: 'block'` in style objects gets converted to `display: 'none'` by RN Web. Don't use non-RN display values.
