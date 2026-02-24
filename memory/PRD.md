# CARE WATCH - PRD (Product Requirements Document)

## Original Problem Statement
CARE WATCH is a sophisticated preventative health application. The central goal is to transform the app from a simple data dashboard into a guided, engaging, and personalized health and longevity transformation engine. The system supports beneficiaries, guardians, teleassistance operators, admins, and company (SAAD) roles.

## Tech Stack
- **Frontend**: React Native / Expo (web + native iOS)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via Emergent LLM Key (persona "Nora")
- **Build**: EAS (Expo Application Services) for iOS TestFlight

## Core Features Implemented
- Multi-role dashboards (Beneficiary, Guardian, Teleassistance, Admin, Company)
- AI Chat assistant "Nora" with medical persona
- Morning Briefing (personalized AI daily summary)
- Health Programs system (discovery → daily missions → reports)
- Device management (Bracelet, Scale, Vest)
- Alert/SOS system with intervention chain
- Reminders (hydration, medication, alarms)
- Profile editing with full medical records
- Internationalization (7 languages: FR, EN, DE, ES, IT, PT, NL)
- Custom glassmorphism tab navbar
- Full-screen video loader

## Architecture

```
/app
├── backend/
│   ├── routes/
│   │   ├── health_routes.py
│   │   ├── chat_routes.py
│   │   └── user_routes.py
│   └── server.py
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # BeneficiaryHome + Dashboard Router (~773 lines, was 2625)
│   │   │   ├── _layout.tsx        # Custom glassmorphism navbar
│   │   │   ├── health.tsx
│   │   │   ├── profile.tsx
│   │   │   └── programs.tsx
│   │   ├── morning-briefing.tsx
│   │   └── chat-ia.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── constants.ts          # Shared theme constants, image URLs (46 lines)
│   │   │   │   ├── SharedUI.tsx          # Card, HeroCard, PillButton, etc. (119 lines)
│   │   │   │   ├── BeneficiaryPopups.tsx # 7 popup components extracted (347 lines)
│   │   │   │   ├── GuardianHome.tsx      # Guardian dashboard (633 lines)
│   │   │   │   ├── TeleassistanceHome.tsx # Teleassistance dashboard (114 lines)
│   │   │   │   ├── AdminHome.tsx         # Admin dashboard + RewardsCard (202 lines)
│   │   │   │   ├── CompanyHome.tsx       # Company/SAAD dashboard (343 lines)
│   │   │   │   ├── AlertBanner.tsx
│   │   │   │   ├── VitalsRow.tsx
│   │   │   │   ├── ActivitySleep.tsx
│   │   │   │   ├── CopilotCard.tsx
│   │   │   │   ├── DeviceCards.tsx
│   │   │   │   └── WeighingFlow.tsx
│   │   │   ├── health/
│   │   │   └── FullScreenLoader.tsx
│   │   └── translations/
│   │       └── i18n.ts
│   └── assets/
```

## Key API Endpoints
- `POST /api/users/update-profile`
- `POST /api/chat` (Nora AI)
- `POST /api/devices/remove-by-type`
- `GET /api/health/morning-briefing`
- `POST /api/alerts` (SOS)
- `GET /api/alerts/active-with-interventions`

## Test Credentials
| Role | Phone / Email | Password |
|---|---|---|
| Beneficiary | +33651245918 | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Prioritized Backlog

### P0 (Critical)
- iOS TestFlight build verification (build was initiated previously)
- Lefu Scale BLE data parsing fix (pre-existing bug, needs native testing)

### P1 (High)
- Full i18n audit (convert all remaining hardcoded strings to t() function)
- Native BLE integration debugging (bracelet, scale, vest)

### P2 (Medium)
- Team/group programs UI
- Shopify integration
- Offline mode for "intervenants"

### P3 (Low)
- Further BeneficiaryHome refactoring (still ~1100 lines, popups could be extracted)

## Known Issues
- Lefu Scale live data parsing is incorrect (hardware integration bug)
- SMS for "forgot password" is MOCKED
- Expo tunnel/cache instability in dev environment (workaround: static web export)
- Portuguese and Dutch translation keys are incomplete
