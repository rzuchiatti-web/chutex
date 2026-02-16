# CARE WATCH — Product Requirements Document

## Original Problem Statement
AI tele-assistance platform "CARE WATCH" (formerly CHUTEX) with B2B portal, AI alert dispatch, push notifications, and multi-role dashboards. The platform supports 6 user roles: Beneficiary, Guardian, Teleassistance, Admin, Prescriber Company, and Intervenant.

## Current Design Direction
**Premium Warm UI** — Inspired by Oura Ring, MoniPay, and Prakthis reference designs.
- Warm amber/copper gradient hero sections
- White rounded cards (24px radius) with soft shadows
- Pill-shaped buttons (dark primary, warm orange CTA)
- Circular quick action icons with colored backgrounds
- Floating glass tab bar with copper accent (#C67A4F)
- Warm cream background (#FAF8F5)
- Inter font family

## Core Features Implemented
- Multi-role authentication (6 roles)
- Role-based dashboards with hero gradient sections
- SOS alert system with pulsing button
- Health vitals monitoring (heart rate, SpO2, temperature, steps)
- Guardian/beneficiary linking with relationship picker
- Push notifications system
- AI recommendations
- Reminders system (hydration, medication, alarms)
- Teleconsultation card
- Device management (bracelet, vest)
- Prescriber ranking and rewards system
- Back-office administration
- Multi-language support (FR, EN, DE, ES, IT)
- Onboarding flow

## Design System Tokens
| Token | Value |
|-------|-------|
| Background | #FAF8F5 |
| Card | #FFFFFF |
| Text Primary | #1C1917 |
| Text Secondary | #78716C |
| Text Muted | #A8A29E |
| Accent (Copper) | #C67A4F |
| Hero Gradient | #D4845A → #E8A87C → #F5CBA7 |
| Care Violet | #7C5CFF |
| Danger | #EF4444 |
| Success | #10B981 |
| Card Radius | 24px |
| Button Radius | 9999px (pill) |

## What's Been Implemented (Feb 2026)
- [x] Complete premium warm redesign of all screens
- [x] Login page with gradient hero card
- [x] Beneficiary dashboard with warm hero, quick actions, SOS
- [x] Guardian dashboard with copper hero and beneficiary cards
- [x] Teleassistance dashboard with purple hero
- [x] Admin dashboard with dark hero
- [x] Company dashboard with warm hero
- [x] Profile page with warm design
- [x] Floating glass tab bar with copper accent
- [x] CSS animations (fadeInUp, gradientShift, sosPulse, float)
- [x] Updated all detail pages with warm color palette
- [x] Guardian/beneficiary relationship feature
- [x] Safari keyboard bug fix (pure HTML login form)

## Known Issues
1. **Lefu Scale BLE Data Parsing** (P1) — 30+ health metrics not functional
2. **Native App Backend Connectivity** (P2) — TestFlight needs permanent URL
3. **iOS Build Process** (P3) — Fragile EAS build process

## Pending/Upcoming Tasks
- P1: Deploy backend to permanent host
- P2: Native Build and BLE Integration for J-Style bracelet
- P3: Shopify Integration (blocked on user info)
- P4: Offline Mode for intervenants

## Tech Stack
- Frontend: React Native / Expo Router / React Native Web
- Backend: FastAPI / Python
- Database: MongoDB
- Integrations: OpenAI (Emergent LLM Key), Expo EAS
