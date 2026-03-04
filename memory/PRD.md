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

### Mar 4, 2026 - WeighingFlow BLE Fonctionnel + Bouton Appeler
- **WeighingFlow reel**: Reecrit pour utiliser Web Bluetooth (navigator.bluetooth). Flux: Instructions → "Je suis prêt" → popup Bluetooth navigateur → connexion balance → poids en direct 15s → sauvegarde API → resultats reels.
- **Fix poids x10**: Parsing weight essaie /10 en priorite puis /100 pour trouver la valeur dans la plage 20-250 kg.
- **Bouton Appeler**: Ajoute sur la fiche beneficiaire (espace gardien) avec le telephone du beneficiaire.
- **Fix DeviceCard**: "Nouvelle pesee" sur balance non-associee ouvre WeighingFlow (au lieu du pairing).

### Mar 4, 2026 - Dashboard Device Cards Navigation + Trend Chart
- Clic carte dispositif → page Dispositifs (popups supprimes)
- Mini graphique SVG tendance poids dans WeighingFlow step 4

### Mar 4, 2026 - Refactoring devices.tsx
- 1773 → 49 lignes. 5 composants extraits.
- Fix WeighingFlow step transition.
- Tests: iteration_84 - 100%

### Mar 4, 2026 - 3 UI/UX Guardian Fixes + Nora AI Fix
- Notifications gardien web, beneficiary detail, guardian popup
- Tests: iterations_82-83 - 100%

## Upcoming Tasks
- P0: Validation utilisateur pesee BLE en conditions reelles (tester avec balance physique)
- P1: Test iOS TestFlight BLE natif
- P2: Regression UI globale

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Face ID / biometrie
- Deploiement production

## Key Files
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux pesee BLE reel (Web Bluetooth)
- `frontend/src/hooks/useBleConnection.ts`: Hook BLE (bracelet/gilet/balance)
- `frontend/src/components/devices/DeviceCard.tsx`: Carte appareil
- `frontend/src/components/devices/DeviceManagement.tsx`: Gestion appareils
- `frontend/app/beneficiary-detail.tsx`: Fiche beneficiaire + bouton appeler
