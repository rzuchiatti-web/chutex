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

### Mar 4, 2026 - Carte Activite + Age Corporel Nora AI + BLE Timing
- **Carte Activite pleine largeur**: Ajoutee sous les 4 cartes vitales (rythme, saturation, pression, temperature) dans la page sante. Affiche Pas (6000), Calories (300kcal), Distance (4km) avec barres de progression.
- **Age corporel Nora**: Endpoint `/api/health/body-age` - Nora estime l'age biologique base sur TOUTES les donnees depuis l'inscription. Necessite 7 jours de collecte.
- **Objectifs journaliers confirmes**: `daily_plan` genere des objectifs reels (hydratation, pas, sommeil) bases sur les donnees des appareils. Morning briefing et check-in quotidien fonctionnels.
- **BLE Timing**: Seuils ajustes a 30s minimum + 20s silence pour meilleure synchro balance.
- Tests: iterations 86-87 - 100%

### Mar 4, 2026 - WeighingFlow BLE Fonctionnel + Bouton Appeler
- WeighingFlow reel: Web Bluetooth, parsing bytes[3-4] little-endian / 100
- Bouton Appeler sur fiche beneficiaire gardien

### Mar 4, 2026 - Refactoring devices.tsx
- 1773 -> 49 lignes. 5 composants extraits.

## Upcoming Tasks
- P0: Validation utilisateur pesee BLE avec balance physique
- P1: Test iOS TestFlight BLE natif
- P2: Regression UI globale

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Affichage contrat PDF (page abonnement)
- Badge gilet standby orange
- Deploiement production

## Key Files
- `frontend/app/(tabs)/health.tsx`: Page sante avec carte activite
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux pesee BLE
- `frontend/src/components/health/HeroScore.tsx`: Age biologique Nora
- `frontend/src/components/health/AnalysisPhase.tsx`: Phase collecte 7 jours
- `backend/routes/health_report_routes.py`: Endpoints body-age + daily-report
- `backend/routes/advanced_routes.py`: Morning briefing + checkin-daily
- `backend/services/nora_context.py`: Contexte IA enrichi
