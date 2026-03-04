# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone/Email | Password |
|------|-------------|----------|
| Beneficiary | 0651245918 | test123 |
| Admin | admin@chutex.fr | demo123 |
| SAAD | 0499887766 | demo123 |
| Guardian #1 | 0612345678 | test123 |
| Guardian #2 | 0698765432 | test123 |

## Completed Features

### Mar 4, 2026 - Dashboard Device Cards → Navigation + Weight Trend Chart
- **Dashboard device cards**: Clic sur une carte dispositif navigue vers la page Dispositifs (suppression des 3 popups bracelet/gilet/balance). DeviceCards.tsx 397 → 279 lignes.
- **Mini graphique tendance poids**: SVG line chart dans le step 4 du WeighingFlow montrant les 5-10 dernieres pesees avec gradient, badge tendance (+/- kg), et point courant.
- Tests: iteration_85 - Frontend 85% (6/7 PASS, 1 issue Playwright navigation timing)

### Mar 4, 2026 - Refactoring devices.tsx + Fix Balance Card
- Refactoring complet de `devices.tsx`: 1773 → 49 lignes. 5 composants extraits.
- Fix carte balance: "Pesees" retire, "Nouvelle pesee" ouvre WeighingFlow.
- Fix WeighingFlow: step 1 → step 3 direct (15s video countdown).
- Tests: iteration_84 - Frontend 100%

### Mar 4, 2026 - 3 UI/UX Guardian Fixes
- Bug Fix: Popup notifications dashboard gardien web.
- Tests: iteration_83 - Frontend 100%

### Mar 4, 2026 - Fix recommendations Nora sans donnees
- Tests: iteration_82 - Backend 11/11, Frontend 100%

### Mar 3, 2026 - Refactoring + Push Notifs + Programmes + Alertes + Safe Zones
- Tests: iterations 70-81 - 100%

### Mar 1-2, 2026 - BLE + Simulation Removal + Programs + Nora IA

## Upcoming Tasks
- P0: Validation utilisateur BLE en conditions reelles
- P1: Test iOS TestFlight complet du bridge BLE natif
- P2: Regression UI globale

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Face ID / biometrie
- Integration EBP comptable
- Mode hors-ligne intervenants

## Key Files
- `frontend/app/(tabs)/devices.tsx`: Routeur fin (49L)
- `frontend/src/components/devices/*`: Composants dispositifs extraits
- `frontend/src/components/dashboard/DeviceCards.tsx`: Cartes dispositifs dashboard (279L)
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux pesee + graphique tendance (164L)
- `frontend/src/components/dashboard/GuardianHome.tsx`: Dashboard gardien + notifications
