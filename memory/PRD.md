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
- Health Programs system (discovery -> daily missions -> reports)
- Device management (Bracelet, Scale, Vest)
- Alert/SOS system with intervention chain
- Reminders (hydration, medication, alarms)
- Profile editing with full medical records
- Internationalization (7 languages: FR, EN, DE, ES, IT, PT, NL)
- Custom glassmorphism tab navbar
- Full-screen video loader
- **NEW: Complete metric-detail page redesign with chart/gauge dual mode**
- **NEW: PDF health report export with period selection (backend ready, frontend removed for now)**
- **NEW: Dynamic SleepHypnogram component replacing static sleep charts**

## Architecture

```
/app
├── backend/
│   ├── routes/
│   │   ├── health_routes.py
│   │   ├── health_report_routes.py  # metric-history, section-analysis, daily-report
│   │   ├── chat_routes.py
│   │   └── user_routes.py
│   └── server.py
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Dashboard Router (~773 lines)
│   │   │   ├── _layout.tsx        # Custom glassmorphism navbar
│   │   │   ├── health.tsx         # Health hub page (vitals, sections, weighing, ECG)
│   │   │   ├── profile.tsx
│   │   │   └── programs.tsx
│   │   ├── metric-detail.tsx      # REDESIGNED: Chart/Gauge dual mode per metric type
│   │   ├── health-detail.tsx      # Section detail (cardio, metabolism, etc.)
│   │   ├── morning-briefing.tsx
│   │   └── chat-ia.tsx
│   └── src/
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── constants.ts, SharedUI.tsx, BeneficiaryPopups.tsx
│       │   │   ├── GuardianHome.tsx, AdminHome.tsx, CompanyHome.tsx
│       │   │   ├── TeleassistanceHome.tsx, AlertBanner.tsx
│       │   │   ├── VitalsRow.tsx, ActivitySleep.tsx
│       │   │   ├── CopilotCard.tsx, DeviceCards.tsx, WeighingFlow.tsx
│       │   ├── health/
│       │   │   ├── HealthSections.tsx, SleepCard.tsx
│       │   │   ├── HeroScore.tsx, AnalysisPhase.tsx
│       │   │   ├── DailyObjectives.tsx, AdminClients.tsx
│       │   ├── FullScreenLoader.tsx
│       └── translations/
│           └── i18n.ts
```

## Key API Endpoints
- `POST /api/auth/login`
- `POST /api/chat` (Nora AI)
- `GET /api/health/daily-report`
- `GET /api/health/metric-history/{key}?period={period}` - Returns chart data with meta, history, stats
- `GET /api/health/section-analysis/{section_id}` - AI analysis per health category
- `GET /api/health/thresholds/{metric_id}` - User alert thresholds
- `POST /api/health/thresholds` - Save thresholds
- `POST /api/alerts` (SOS)

## Test Credentials
| Role | Phone / Email | Password |
|---|---|---|
| Beneficiary | +33651245918 | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## What's Been Implemented (Latest Session - Feb 24, 2026)

### Metric Detail Page Complete Redesign
- **Chart mode** for time-varying metrics: smooth area curves (heart rate, SpO2, temp), bars (steps, calories, distance), dual-bars (blood pressure), scatter (HRV)
- **Gauge mode** for stable/index metrics: semi-circular gauge with colored zones (BMI, visceral fat, waist-hip ratio), sparkline for trend
- **Smart Nora analysis**: per-metric AI text with zone-specific medical advice
- **Bug fix**: Tension now correctly navigates to `blood_pressure` (was incorrectly `heart_rate`)
- All data-testids added for testing

### Metric Types and Visualization Decisions
| Metric | Display Mode | Chart Type | Rationale |
|--------|-------------|------------|-----------|
| heart_rate | Chart | Area/line | Continuous monitoring, trends matter |
| hrv | Chart | Scatter | Shows variability |
| spo2 | Chart | Area | Threshold monitoring (>95%) |
| blood_pressure | Chart | Dual bars | Two values (systolic/diastolic) |
| temperature | Chart | Smooth line | Fever patterns |
| steps | Chart | Bars | Daily discrete counts |
| calories | Chart | Bars | Daily discrete counts |
| stress_level | Chart | Area | Stress patterns |
| weight | Chart | Smooth line | Long-term trend |
| bmi | Gauge | Semi-circle | Relatively stable index |
| visceral_fat | Gauge | Semi-circle | Stable index with zones |
| waist_hip_ratio | Gauge | Semi-circle | Single measurement |
| body_age | Gauge | Semi-circle | Comparison value |
| ideal_weight | Gauge | Semi-circle | Target comparison |

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

### P3 (Low / Refactoring)
- Decompose GuardianHome.tsx (633 lines)
- Further BeneficiaryHome refactoring

## Known Issues
- Lefu Scale BLE data parsing (blocked on iOS build)
- SMS for "forgot password" is mocked
- All hardware interactions (ECG, Weighing) are simulations with mock data
