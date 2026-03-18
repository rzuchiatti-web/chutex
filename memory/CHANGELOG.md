# Chutex Care — Changelog

## 2026-03-18 — SOS Call Fix + Refactoring Complete
- **VAPI.ai SOS Call FIXED**: Updated VAPI_API_KEY, VAPI_PATIENT_ASSISTANT_ID, VAPI_GUARDIAN_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID with valid credentials
- Verified: patient call + 5 guardian calls launched in parallel successfully
- Call analysis working (structuredData returned)

## 2026-03-18 — Complete Code Refactoring
- **teleconsult.tsx**: 1942 → 104 lines (95%) — 7 components extracted
- **index.tsx**: 1073 → 23 lines (98%) — BeneficiaryHome + DailyObjectives extracted
- **health.tsx**: 433 → 386 lines — GlycemiaCard extracted
- All tests passed (iterations 118 & 119): 100% backend APIs, zero bundle errors

## 2026-03-17 — Component Extraction Phase 1
- Created barrel file for dashboard components
- Fixed WeightGoalDashCard import path

## 2026-03-16 — Performance Optimization
- Added batch endpoint /api/dashboard/batch
- Frontend caching layer in services/api.ts

## 2026-03-15 — UI/UX Overhaul
- Premium program cover images (AI-generated)
- Card styling, element positioning fixes
- Join team program via invite code

## Earlier
- Full auth, dashboard, alertes SOS, interventions Care
- Programmes equipe, Chat IA, bracelets connectes
