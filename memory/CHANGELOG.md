# Chutex Care — Changelog

## 2026-03-18 — Complete Code Refactoring
- **teleconsult.tsx**: 1942 → 104 lines (95% reduction)
  - Extracted 7 components: BeneficiaryTeleconsult, TeleassistanceDashboard, GuardianInterventions, AdminIntervenants, CompanyInterventionsTab, CompanyIntervenants, CompanyPrescriptions
  - Shared styles in teleconsultStyles.ts
- **index.tsx**: 1073 → 23 lines (98% reduction)
  - Extracted BeneficiaryHome (499 lines) and DailyObjectives (99 lines)
  - Dashboard is now a pure role-based router
- **health.tsx**: 433 → 386 lines (11% reduction)
  - Extracted GlycemiaCard to components/health/GlycemiaCard.tsx
- All tests passed: 100% backend API success, no bundle errors, all imports verified

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
