# Chutex Care — Product Requirements Document

## Problem Statement
Full-stack health monitoring and teleassistance platform for elderly care. Features include health tracking (bracelet + scale), teleconsultation, program management, guardian management, and AI-powered health analysis.

## User Personas
- **Beneficiary** (elderly user): Health tracking, SOS alerts, teleconsultation
- **Guardian** (family member): Monitor beneficiary health, receive alerts
- **Admin/Teleassistance**: Platform management, intervention coordination
- **Prescriber Company**: SAAD management, interventions

## Core Requirements
1. Real-time health monitoring (heart rate, SpO2, BP, sleep, steps, weight)
2. AI-powered health analysis via Nora (GPT-5.2)
3. Teleconsultation with QCM pre-consultation
4. Program management (interactive missions, team programs)
5. Guardian/emergency contact management
6. Device management (bracelet, scale, vest)
7. Subscription management (Care plan)

## Architecture
- **Backend**: FastAPI + MongoDB (motor)
- **Frontend**: React Native for Web (Expo Router)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **External APIs**: Lefu Cloud, Mollie, VAPI.ai, Mailjet, SMSMode, Stripe

## Key Endpoints
- `POST /api/auth/login` — Login
- `GET /api/health/daily-report` — AI-powered daily health summary
- `GET /api/programs/active` — Active programs
- `GET /api/programs/team/feed` — Team activity feed
- `GET /api/subscriptions/my` — Current subscription
- `GET /api/devices/dashboard-summary` — Device status

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| Beneficiary | 0651245918 | test123 |
| Guardian (Marie) | +33699887766 | test123 |

## What's Been Implemented
See CHANGELOG.md for detailed history.

## Backlog
See ROADMAP.md for prioritized features.
