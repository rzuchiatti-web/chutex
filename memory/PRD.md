# Chutex Care - PRD

## Original Problem Statement
Health monitoring and care application for elderly beneficiaries ("Chutex Care"). Features include smart bracelet/scale integration, AI assistant "Nora", guardian alerts, wellness programs, nutrition tracking, and teleassistance.

## Core Architecture
- **Frontend**: React Native (Expo) served as web
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT via Emergent LLM key (Nora assistant)
- **3rd Party**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## What's Been Implemented

### Session - March 12, 2026
1. **Meal Recipe Step Icons** - Added contextual cooking icons (couper, cuire, melanger, servir, etc.) to meal preparation steps in `meal-detail.tsx` using keyword detection. 12 icon categories mapped to French cooking verbs.
2. **Page Load Optimization** - Created lightweight `/api/minceur/exercises` endpoint replacing heavy `/api/minceur/weight-details` in `activity-detail.tsx`. Deferred AI analysis loading in `health-detail.tsx` so page content renders immediately.
3. **Morning Briefing Redirect** - Re-enabled the auto-redirect to `/morning-briefing` on first daily visit in `(tabs)/index.tsx`.

### Previous Sessions (Summary)
- Dashboard with light/dark mode toggle
- Nora AI re-branding with reusable `NoraCard.tsx`
- Chat, onboarding, morning briefing UI redesigns
- Dorsi Bilan bug fix
- Dashboard crash fixes (React hooks, CSS variables)
- Edge-to-edge display

## Prioritized Backlog

### P0 (Blocked - External)
- V6 Bracelet 4G Integration (waiting manufacturer firmware)
- Lefu Scale WiFi Pairing (waiting user support)

### P0 (Next)
- True ML for Glycemia Estimation (V3)

### P1
- (none pending)

### P2
- Slow page load on remaining detail pages (partially addressed)

### Future
- Guardian Referral System
- Free 7-Day Trial
- View Contract PDF
- Vivoo Urine Test Integration
- Health Correlations UI
- Technical documentation for glucose algorithm (patent)

## Mocked Features
- Biological Age / Aging Rate
- Glycemia Estimation (V2 algorithm, not true ML)
- Sleep Data (detailed metrics simulated)

## Test Credentials
| Role | Email/Phone | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian 1 | +33689896539 | test123 |
| Guardian 2 | +33619559380 | test123 |

## Key Files
- `/app/frontend/app/(tabs)/index.tsx` - Main dashboard
- `/app/frontend/app/meal-detail.tsx` - Meal detail with recipe step icons
- `/app/frontend/app/activity-detail.tsx` - Activity detail (optimized)
- `/app/frontend/app/health-detail.tsx` - Health detail (deferred AI)
- `/app/backend/routes/minceur_routes.py` - Minceur endpoints incl. /exercises
- `/app/frontend/components/shared/NoraCard.tsx` - Reusable Nora component
