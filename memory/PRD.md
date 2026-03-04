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

### Mar 4, 2026 - Refactoring devices.tsx + Fix Balance Card
- **Refactoring complet de `devices.tsx`**: 1773 lignes -> 49 lignes (routeur fin)
- **Composants extraits**: PrescriptionManagement (914L), CompanyPrescriptionsTab (415L), AdminPrescripteurs (243L), RewardsCard (117L), SubscribersList (69L)
- **Fix Balance Card**: Bouton "Pesees" retire de la carte balance, seul "Nouvelle pesee" + info reste
- **Fix WeighingFlow**: "Nouvelle pesee" ouvre maintenant le WeighingFlow (avant: lancait BLE scan directement)
- **Fix WeighingFlow Step**: "Je suis pret" va directement au countdown video 15s (saut step 2 bloque)
- Tests: iteration_84 - Frontend 100% (14/14 features verified)

### Mar 4, 2026 - 3 UI/UX Guardian Fixes
- **Bug Fix**: Popup notifications manquant dans dashboard gardien web
- **UI verified**: Beneficiary detail page + Guardian popup
- Tests: iteration_83 - Frontend 100%

### Mar 4, 2026 - Fix recommendations Nora sans donnees
- Sanitisation donnees, suppression simulation sommeil, fallback IA
- Tests: iteration_82 - Backend 11/11, Frontend 100%

### Mar 3, 2026 - Refactoring devices.tsx (partiel)
- DeviceManagement extracte avec hooks + composants
- Tests: iteration_81 - Frontend 10/10 (100%)

### Mar 3, 2026 - Push Notifications + Refonte Programmes
- Push Notifications safe zone + Programmes refonte complete
- Tests: iteration_80 - Backend 7/7 + Frontend 100%

### Mar 3, 2026 - Bug Fix Alertes + UI beneficiaire + Safe Zones + Location
- Corrige crash alertes, badge gilet, refonte fiche beneficiaire
- Safe zones CRUD, permission localisation, popup glass
- Tests: iterations 70-79 - 100%

### Mar 2, 2026 - BLE + Suppression Simulation + Appairage Reel
- Gilet, bracelet BLE reel, suppression totale simulation

### Mar 1-2, 2026 - Programmes, Nora IA, Fonctionnalites Avancees
- 10 programmes prevention, Nora contextuelle, streaks, alertes predictives

## Upcoming Tasks
- P0: Validation utilisateur BLE en conditions reelles
- P1: Test iOS TestFlight complet du bridge BLE natif
- P2: Regression UI globale roles gardien/SAAD/admin

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Face ID / biometrie
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production

> Decision produit: **Rapport PDF sante partageable retire du scope**.

## Key Files
- `frontend/app/(tabs)/devices.tsx`: Routeur fin (49 lignes) - importe les composants
- `frontend/src/components/devices/DeviceManagement.tsx`: Gestion appareils BLE
- `frontend/src/components/devices/DeviceCard.tsx`: Carte appareil individuel
- `frontend/src/components/devices/PrescriptionManagement.tsx`: Espace prescripteur gardien
- `frontend/src/components/devices/AdminPrescripteurs.tsx`: Admin prescripteurs
- `frontend/src/components/devices/CompanyPrescriptionsTab.tsx`: SAAD prescriptions
- `frontend/src/components/devices/SubscribersList.tsx`: Teleassistance abonnes
- `frontend/src/components/devices/RewardsCard.tsx`: Challenge prescripteurs
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux de pesee 15s video
- `frontend/src/components/dashboard/GuardianHome.tsx`: Dashboard gardien + notifications
- `frontend/app/beneficiary-detail.tsx`: Fiche beneficiaire gardien
- `backend/services/health_logic.py`: Logique sante + sanitisation
