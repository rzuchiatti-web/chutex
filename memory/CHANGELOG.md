# Chutex Care — Changelog

## 2026-03-18 — Teleconsult Page Refactoring Complete
- Decomposed monolithic `teleconsult.tsx` (1942 lines) into 7 sub-components + 1 shared styles file
- Main container file reduced to 104 lines (95% reduction)
- Components extracted:
  - `BeneficiaryTeleconsult.tsx` (160 lines) — QCM flow
  - `TeleassistanceDashboard.tsx` (216 lines) — Care Watch
  - `GuardianInterventions.tsx` (381 lines) — Guardian management
  - `AdminIntervenants.tsx` (282 lines) — Admin panel
  - `CompanyInterventionsTab.tsx` (269 lines) — Company interventions
  - `CompanyIntervenants.tsx` (87 lines) — Company intervenants list
  - `CompanyPrescriptions.tsx` (128 lines) — Company prescriptions
  - `teleconsultStyles.ts` (136 lines) — Shared styles/constants
- All backend APIs verified working (login, subscriptions, teleconsult questions, interventions)
- No bundle errors or import issues

## 2026-03-17 — Component Extraction Phase 1
- Created barrel file for dashboard components (index.ts)
- Fixed WeightGoalDashCard import path
- Started teleconsult component extraction (5 components)

## 2026-03-16 — Performance Optimization
- Added batch endpoint `/api/dashboard/batch`
- Frontend caching layer in `services/api.ts`

## 2026-03-15 — UI/UX Overhaul
- Premium program cover images (AI-generated)
- Card styling, element positioning fixes
- No device states, health data re-seeding
- Join team program via invite code
- Glassmorphism design, Toast structural fix

## Earlier
- Full auth, dashboard sante, alertes SOS, interventions Care
- Programmes equipe, Chat IA, bracelets connectes
- Prescriptions, abonnements Mollie
