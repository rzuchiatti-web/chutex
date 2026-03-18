# Chutex Care — Changelog

## 2026-03-18 — ML V3 Glycemia Estimation
- Built GradientBoostingRegressor model pre-trained on 6000 synthetic samples
- Medical literature correlations: HRV, visceral fat, SpO2, sleep, activity, BMI, etc.
- 3-tier architecture: Population (day 1) → Personal (5+ calibrations) → Calibration (optional)
- Top features: hrv_norm (27.2%), has_diabetes_risk (24.7%), visceral_fat (17.7%)
- Prediction intervals with confidence bounds (tree variance)
- New endpoints: /api/glycemia/estimate (V3), /api/glycemia/ml-status
- All 20 tests passed (iteration 120)

## 2026-03-18 — SOS Call Fix
- Updated VAPI_API_KEY, assistant IDs, phone number ID with valid credentials
- Patient call + 5 guardian calls launched in parallel successfully

## 2026-03-18 — Complete Code Refactoring
- teleconsult.tsx: 1942 → 104 lines (95%)
- index.tsx: 1073 → 23 lines (98%)
- health.tsx: 433 → 386 lines (GlycemiaCard extracted)
- All tests passed (iterations 118 & 119)

## Earlier
- Full auth, dashboard, SOS, interventions Care, programmes, Chat IA
- Performance optimisations, UI premium, bracelets connectes
