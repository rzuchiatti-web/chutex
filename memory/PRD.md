# Chutex Care - PRD

## Original Problem Statement
Health monitoring application for elderly beneficiaries with IoT device integration (bracelet, scale, vest), AI-powered health recommendations (Nora), guardian monitoring, teleassistance, and rehabilitation programs (Dorsi).

## Architecture
- Frontend: React Native (Expo) - Web + Mobile
- Backend: FastAPI + MongoDB
- AI: GPT-5.2 via Emergent LLM Key
- IoT: Lefu Scale (WiFi webhook), V6 Bracelet (4G webhook planned), Dorsi cushion (BLE)

## What's Been Implemented

### Session 2026-03-12
- **Bug Fix: Dorsi Bilan Server Error** - Fixed error handling in `submitBilan` and `createProgram` with defensive data construction ensuring all 4 directions have mobility+pain, clear error messages for session expiry vs generic errors
- **Dashboard Redesign** - Applied new visual design based on user mockup:
  - NoraPill: Black pill badge with Nora video thumbnail centered above objectives
  - TypewriterTitle: Blinking cursor typewriter-style titles on all sections
  - Objective cards: 2x2 grid with 3D images (kcal, hydration, muscle, sleep)
  - CopilotCard: Black card with Nora video on right side
  - Guardians card: Guardian illustration image added
  - Slide-up animations (`dash-slide-up`) on all cards
  - CSS: `@keyframes dashSlideUp` and `@keyframes twBlink` for cursor blink

### Previous Sessions
- Full IoT integration (Lefu WiFi webhook, V6 4G webhook)
- Dashboard glassmorphism theme with dark background
- Dorsi rehabilitation program (bilans, games, streaks, AI adaptive)
- Health metrics, weight goals, programs
- Multi-role system (beneficiary, guardian, teleassistance, admin, company)
- Morning briefing AI, Nora AI chat

## Pending Issues
- P1: Swipe Picker bug in weight goal setting
- P2: Slow page load on detail pages
- P2: Visuals/icons for meal preparation steps

## Blocked Tasks
- Lefu Scale WiFi pairing (user blocked by manufacturer app)
- V6 Bracelet 4G firmware ($5000 custom firmware pending)

## Upcoming Tasks
- P0: True ML for Glycemia Estimation (V3)
- P1: Meal preparation step icons
- Guardian Referral System
- Free 7-Day Trial
- View Contract PDF
- Vivoo Urine Test Integration
- Health Correlations UI
- Patent documentation for glucose algorithm

## Assets
- Nora Video: https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4
- Kcal Image: https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/385muol8_img_kcal.png
- Guardians Image: https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/ashlkedd_img_gardians.png

## Credentials
| Role | Email/Phone | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian 1 | +33689896539 | test123 |
| Guardian 2 | +33619559380 | test123 |
