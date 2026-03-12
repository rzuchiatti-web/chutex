# Chutex Care - PRD

## Original Problem Statement
Health monitoring and care application for elderly beneficiaries ("Chutex Care"). Features include smart bracelet/scale integration, AI assistant "Nora", guardian alerts, wellness programs, nutrition tracking, and teleassistance.

## Core Architecture
- **Frontend**: React Native (Expo) served as web
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT via Emergent LLM key (Nora assistant)
- **3rd Party**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## What's Been Implemented

### Session - March 12, 2026 (Batch 2)
1. **Morning briefing overlay removed** — Nora video opacity changed from 0.6 to 1.0, no overlay
2. **Nora onboarding redesigned** — Big video stays at top, premium scrolling text (longevity, health, aging well), no icons, Nora presents herself first then the app, short phrases with spacing, "Passer" skip + "Continuer" at end
3. **Health page bio age pill** — Pure black pill with Nora video on the left + "AGE BIOLOGIQUE" text, replacing the old purple "N" badge

### Session - March 12, 2026 (Batch 1)
1. **Meal Recipe Step Icons** — 12 contextual cooking icons in `meal-detail.tsx`
2. **Page Load Optimization** — Lightweight `/api/minceur/exercises` endpoint, deferred AI in `health-detail.tsx`
3. **Morning Briefing Redirect** — Re-enabled auto-redirect in `index.tsx`

### Previous Sessions (Summary)
- Dashboard with light/dark mode toggle
- Nora AI re-branding with reusable `NoraCard.tsx`
- Chat, onboarding, morning briefing UI redesigns
- Dorsi Bilan bug fix, Dashboard crash fixes
- Edge-to-edge display

## Prioritized Backlog

### P0 (Blocked - External)
- V6 Bracelet 4G Integration (waiting manufacturer firmware)
- Lefu Scale WiFi Pairing (waiting user support)

### P0 (Next)
- True ML for Glycemia Estimation (V3)

### P2
- Slow page load on remaining detail pages (partially addressed)

### Future
- Guardian Referral System
- Free 7-Day Trial
- View Contract PDF
- Vivoo Urine Test Integration
- Health Correlations UI
- Documentation glucose algorithm (patent)

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
- `/app/frontend/app/(tabs)/health.tsx` - Health page
- `/app/frontend/app/onboarding.tsx` - Onboarding with Nora intro
- `/app/frontend/app/morning-briefing.tsx` - Morning briefing (no overlay)
- `/app/frontend/app/meal-detail.tsx` - Meal detail with recipe step icons
- `/app/frontend/app/activity-detail.tsx` - Activity detail (optimized)
- `/app/frontend/src/components/health/HeroScore.tsx` - Bio age with Nora pill
- `/app/backend/routes/minceur_routes.py` - Minceur endpoints incl. /exercises
- `/app/frontend/components/shared/NoraCard.tsx` - Reusable Nora component
