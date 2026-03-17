# Chutex Care - PRD

## Original Problem Statement
Health monitoring and care application for elderly beneficiaries ("Chutex Care"). Features include smart bracelet/scale integration, AI assistant "Nora", guardian alerts, wellness programs, nutrition tracking, and teleassistance.

## Core Architecture
- **Frontend**: React Native (Expo) served as web
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT via Emergent LLM key (Nora assistant)
- **3rd Party**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## What's Been Implemented

### Session - March 13, 2026
1. **Guardian Navbar Prescription Fix** — Fixed broken "Prescriptions" navigation link in guardian space. Changed WhoopTabBar guardian tab key from `health` to `devices` (which contains `PrescriptionManagement`). Also fixed `devices` tab visibility to only hide for web beneficiaries, not guardians.
2. **Beneficiary Detail Crash Fix** — Fixed `glass is not defined` error in `beneficiary-detail.tsx` that prevented guardians from viewing beneficiary details. Added missing glassmorphism constant.
3. **Beneficiary Profile Card Redesign** — Restructured the main profile card with clear separated sections: Identite (age, genre, date naissance, telephone), Adresse, Physique (taille, poids, IMC), Dossier Medical (groupe sanguin, pathologies, allergies). Each section has an icon header and grid-based InfoCell components.
4. **Dashboard Dispositifs Button** — Moved the "add device" action into the Dispositifs card header as a round white `+` button. Removed the separate "Mes dispositifs" card from the dashboard.
5. **Programs Page Cleanup** — Removed category filter pills, added a glass `?` guide button in the header with a glassmorphism popup explaining how programs work (4 steps: choose, follow daily, check-in, earn badges).
6. **Dashboard Dark Mode Whoop Style** — Redesigned dark mode to match Whoop app aesthetic: solid `#1a1d20` background (removed mountain SVG), solid `#272a30` card backgrounds (removed glassmorphism blur and borders), cleaner spacing. Light mode unchanged.
7. **Animated Dark Background** — Created `AnimatedDarkBg.tsx` reusable component with 3 violet/purple glow orbs with filter blur, slowly floating and pulsing (20-28s cycles) + vignette overlay. Applied to ALL 4 beneficiary pages: Dashboard, Health, Programs, Profile.

### Session - March 12, 2026 (Batch 5)
1. **Whoop-style Navbar** — Glassmorphism floating tab bar (`WhoopTabBar` inline in `_layout.tsx`) for both beneficiary and guardian spaces
2. **LLM Cost Optimization** — Caching (`cachetools`) and prompt optimization in `nora_service.py`
3. **Guardian Experience Refactor** — Redesigned beneficiary detail page, read-only health page, fixed data connection for Nora
4. **Test User** — Created guardian Marie Dupont (+33699887766 / test123) linked to beneficiary Josette

### Session - March 12, 2026 (Batch 4)
1. **Nora Knowledge Update** — Added HDS data hosting info to `nora_context.py`
2. **Standardized Loaders** — Simplified `Loader.tsx` and `FullScreenLoader.tsx`
3. **Guardian Space UI Unification** — Consistent Nora branding
4. **Dashboard Cleanup** — Hide empty sections
5. **Bracelet Popup Redesign** — Single feature showcase

### Session - March 12, 2026 (Batch 3)
1. **Health page header** — Dashboard-style header with avatar
2. **Health page light/dark toggle** — Synced with dashboard via localStorage
3. **Health page light mode** — Adapted elements

### Session - March 12, 2026 (Batch 2)
1. **Morning briefing overlay removed**
2. **Nora onboarding redesigned**
3. **Health page bio age pill**

### Session - March 12, 2026 (Batch 1)
1. **Meal Recipe Step Icons**
2. **Page Load Optimization**
3. **Morning Briefing Redirect**

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
| New Guardian | +33699887766 | test123 |

## Key Files
- `/app/frontend/app/(tabs)/_layout.tsx` - Tab layout with WhoopTabBar (inline)
- `/app/frontend/app/(tabs)/index.tsx` - Main dashboard
- `/app/frontend/app/(tabs)/health.tsx` - Health page (light/dark mode)
- `/app/frontend/app/(tabs)/devices.tsx` - Devices/Prescriptions (PrescriptionManagement for guardians)
- `/app/frontend/src/components/health/HeroScore.tsx` - Bio age with Nora pill
- `/app/frontend/src/components/shared/NoraCard.tsx` - Reusable Nora premium card
- `/app/frontend/src/components/Loader.tsx` - Standardized loader
- `/app/frontend/src/components/dashboard/GuardianHome.tsx` - Guardian dashboard
- `/app/frontend/app/health-readonly.tsx` - Read-only health page for guardians
- `/app/backend/services/nora_service.py` - Nora AI with caching
- `/app/backend/services/nora_context.py` - Nora AI context with HDS knowledge
