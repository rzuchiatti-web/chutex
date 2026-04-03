# Chutex Care - PRD (Product Requirements Document)

## Original Problem Statement
Application iOS de sante connectee (React Native WebView + FastAPI backend) pour les personnes agees.
L'app gere des bracelets connectes (V8/Elio), des balances, et des gilets via BLE.
L'objectif est une plateforme complete de teleassistance avec suivi des constantes vitales en temps reel.

## Architecture
- **Frontend**: React Native (Expo) avec WebView pour iOS. Code BLE natif dans `_layout.tsx` + `bleV8Bridge.ts`
- **Backend**: FastAPI + MongoDB (`vitallink_db`)
- **BLE Protocol**: JStyle 2208A/V8 via service UUID `0000FFF0`, write `FFF6`, notify `FFF7`
- **Roles**: Beneficiaire, Gardien, Professionnel, Admin, SAAD, Teleassistance

## Core Features (Implemented)
- Bracelet V8: HR, SpO2, BP, Temperature, HRV, Stress, Steps, Sleep, ECG, Blood Glucose
- Balance Lefu: Poids, IMC, Masse grasse, etc.
- Rapports quotidiens AI (GPT-5.2 via Emergent LLM Key)
- Alertes et teleassistance
- Programmes de sante et exercices
- Systeme de prescription et abonnement
- Geofencing (safe zones)
- Notifications push
- Stripe/Mollie payments

## Current Session Fixes (2026-04-03)
1. **SpO2 sanitization**: Added validation (60-100) in `_sanitize_data`, `bracelet/status`, `v8/dashboard`
2. **has_device field**: Added to daily report response
3. **Connected timeout**: Extended from 60s to 300s
4. **BLE V8 parser**: Sub-type differentiation for 0x28 command (HRV+BP vs HR vs SpO2)
5. **Padding 70px**: CSS injection via `+html.tsx` + MutationObserver in SafeAreaCSSInjector + manual fixes on 15+ pages
6. **Loader unification**: Replaced ActivityIndicator with DNA video FullScreenLoader in auth loading state
7. **Auto-reconnect**: Removed one-time flag, added periodic retry (every 60s)
8. **Overlay close buttons**: Adjusted from top:20 to top:70 for safe area
9. **DB cleanup**: Cleaned invalid SpO2 (36) from device docs and consolidated readings

## Testing Status
- Backend: 20/20 tests PASS (iteration 207)
- SpO2 validation: 36 rejected, 59 rejected, 60 accepted, 100 accepted, 101 rejected
- HR validation: 250 rejected, 200 accepted
- All V8 data types verified: sleep, battery, ECG, glucose, steps
- Vibration commands working
- Daily report has_device field confirmed

## Pending: User TestFlight Validation
The user needs to test on iOS via TestFlight to verify:
- Padding 70px on all pages
- DNA video loader only
- Bracelet auto-reconnect and data sync
- Correct vitals display

## Upcoming Tasks
- P1: Configuration WiFi de la balance Lefu
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte
- P2: Signature electronique documents Admin
- P2: Systeme de parrainage Gardiens
- P2: Flux d'essai gratuit 7 jours
- P2: Integration test urinaire Vivoo
