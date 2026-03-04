# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.
Objectif: transformer l'app en un moteur de transformation sante et longevite guide, engageant et personnalise.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS, Lefu Cloud API, Web Bluetooth

## Test Credentials
| Role | Phone/Email | Password |
|------|-------------|----------|
| Beneficiary | 0651245918 | test123 |
| Admin | admin@chutex.fr | demo123 |
| SAAD | 0499887766 | demo123 |
| Guardian #1 | 0612345678 | test123 |
| Guardian #2 | 0698765432 | test123 |

## Completed Features

### Mar 4, 2026 - Age Corporel par Nora AI + BLE Timing Fix
- **Age corporel Nora**: Nouvel endpoint `/api/health/body-age` qui utilise Nora (GPT-5.2) pour estimer l'age biologique base sur TOUTES les donnees de sante depuis l'inscription
- **Collecte 7 jours**: L'age corporel n'est calcule qu'apres 7 jours de donnees. Avant cela, un indicateur de progression s'affiche ("Jour X sur 7")
- **Cache intelligent**: Resultat cache 24h dans `body_age_cache`, invalide automatiquement apres nouvelle mesure
- **Integration Nora Context**: Le body_age de Nora est injecte dans le contexte de Nora et remplace la valeur de la balance
- **Frontend**: HeroScore affiche le badge "N" (Nora) avec l'explication IA. AnalysisPhase montre un message specifique pour la collecte d'age corporel
- **BLE Timing**: Seuils ajustes a 30s minimum + 20s silence (vs 25s+15s) pour meilleure synchronisation avec la balance physique
- Tests: iteration_86 - 100% (9/9)

### Mar 4, 2026 - WeighingFlow BLE Fonctionnel + Bouton Appeler
- **WeighingFlow reel**: Reecrit pour utiliser Web Bluetooth (navigator.bluetooth)
- **Fix poids x10**: Parsing weight bytes[3-4] little-endian / 100
- **Bouton Appeler**: Ajoute sur la fiche beneficiaire (espace gardien)

### Mar 4, 2026 - Dashboard Device Cards Navigation + Trend Chart
- Clic carte dispositif -> page Dispositifs (popups supprimes)
- Mini graphique SVG tendance poids dans WeighingFlow step 4

### Mar 4, 2026 - Refactoring devices.tsx
- 1773 -> 49 lignes. 5 composants extraits.

### Mar 4, 2026 - 3 UI/UX Guardian Fixes + Nora AI Fix
- Notifications gardien web, beneficiary detail, guardian popup

## Upcoming Tasks
- P0: Validation utilisateur pesee BLE en conditions reelles (tester avec balance physique)
- P1: Test iOS TestFlight BLE natif
- P2: Regression UI globale

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Affichage du contrat PDF (page abonnement)
- Face ID / biometrie
- Badge gilet standby orange (verif utilisateur)
- Deploiement production

## Key Files
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux pesee BLE reel (Web Bluetooth)
- `frontend/src/components/health/HeroScore.tsx`: Affichage age biologique Nora
- `frontend/src/components/health/AnalysisPhase.tsx`: Phase collecte 7 jours
- `frontend/src/hooks/useBleConnection.ts`: Hook BLE (bracelet/gilet/balance)
- `backend/routes/health_report_routes.py`: Endpoint body-age + daily-report
- `backend/services/nora_context.py`: Contexte IA enrichi avec body age cache
- `backend/services/lefu_service.py`: API Lefu composition corporelle

## Key Endpoints
- `/api/health/body-age`: Age biologique estime par Nora (GET, auth required)
- `/api/health/daily-report`: Rapport sante quotidien avec body_age_nora et analysis_phase
- `/api/devices/scale/ble-measurement`: Mesure BLE balance (POST, auth required)
- `/api/lefu/body_composition`: Composition corporelle via Lefu API
