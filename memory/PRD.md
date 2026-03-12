# Chutex Care - PRD

## Original Problem Statement
Health monitoring and care application for elderly beneficiaries ("Chutex Care"). Features include smart bracelet/scale integration, AI assistant "Nora", guardian alerts, wellness programs, nutrition tracking, and teleassistance.

## Core Architecture
- **Frontend**: React Native (Expo) served as web
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT via Emergent LLM key (Nora assistant)
- **3rd Party**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## What's Been Implemented

### Session - March 12, 2026 (Batch 4)
1. **Nora Knowledge Update** — Added HDS data hosting info (serveurs certifies HDS classe 6, France, Free/Groupe Iliad) to `nora_context.py`
2. **Standardized Loaders** — Simplified `Loader.tsx` and `FullScreenLoader.tsx` to centered white text "Analyse en cours..." with animated dots, removed video/overlay
3. **Guardian Space UI Unification** — Replaced `CopilotCard` with `NoraCard` in `GuardianHome.tsx` and `(tabs)/index.tsx` for consistent Nora branding
4. **Dashboard Cleanup** — Hide DeviceCards section when no connected devices, hide program section when no active program, only show connected devices (no "Non associe")
5. **Bracelet Popup Redesign** — Replaced two-card subscription popup with single feature showcase (9 features: FC, SpO2, temp, sommeil, pas, chute, 4G, Nora, age bio) + white CTA button → chutex-innovation.com

### Session - March 12, 2026 (Batch 3)
1. **Health page header** — Added dashboard-style header with avatar, user name, "Espace sante" subtitle
2. **Health page light/dark toggle** — "Light"/"Dark" text toggle synced with dashboard via localStorage
3. **Health page light mode** — All elements adapted: white bg, gray cards (#EDEDF0), black text, no glassmorphism

### Session - March 12, 2026 (Batch 2)
1. **Morning briefing overlay removed** — Nora video opacity 0.6 → 1.0
2. **Nora onboarding redesigned** — Big video at top, premium scrolling text about longevity/health
3. **Health page bio age pill** — Pure black pill with Nora video on left + "AGE BIOLOGIQUE" text

### Session - March 12, 2026 (Batch 1)
1. **Meal Recipe Step Icons** — 12 contextual cooking icons in `meal-detail.tsx`
2. **Page Load Optimization** — Lightweight `/api/minceur/exercises` endpoint, deferred AI
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
- `/app/frontend/app/(tabs)/index.tsx` - Main dashboard (uses NoraCard)
- `/app/frontend/app/(tabs)/health.tsx` - Health page (light/dark mode)
- `/app/frontend/src/components/health/HeroScore.tsx` - Bio age with Nora pill
- `/app/frontend/src/components/shared/NoraCard.tsx` - Reusable Nora premium card
- `/app/frontend/src/components/Loader.tsx` - Standardized loader (white text)
- `/app/frontend/src/components/FullScreenLoader.tsx` - Standardized full screen loader
- `/app/frontend/src/components/dashboard/GuardianHome.tsx` - Guardian dashboard (uses NoraCard)
- `/app/frontend/app/meal-detail.tsx` - Meal detail with recipe step icons
- `/app/frontend/app/onboarding.tsx` - Onboarding with Nora intro
- `/app/frontend/app/morning-briefing.tsx` - Morning briefing (no overlay)
- `/app/backend/services/nora_context.py` - Nora AI context with HDS knowledge
- `/app/backend/routes/minceur_routes.py` - Minceur endpoints incl. /exercises
