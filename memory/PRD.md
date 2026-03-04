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

### Mar 4, 2026 - Streak Objectifs + Carte Activite + Age Corporel Nora
- **Streak objectifs reels**: Systeme de streak base sur l'atteinte reelle des objectifs (pas>=6000, hydratation>=55%, sommeil>=75%, calories>=200, distance>=3km, IMC 18.5-25, graisse<=25%). Badges: flamme or 7j, flamme rouge 14j, medaille 30j, diamant 100j. Record personnel affiche.
- **Carte Activite pleine largeur**: Sous les 4 cartes vitales. Pas/Calories/Distance avec barres de progression + compteur streak avec flamme et trophee record.
- **Age corporel Nora**: Endpoint `/api/health/body-age` - Nora estime l'age biologique depuis TOUTES les donnees (7 jours min).
- **BLE Timing**: 30s minimum + 20s silence.
- Tests: iterations 86-88 - 100% (tous passes)

### Mar 4, 2026 - WeighingFlow BLE + Refactoring
- WeighingFlow BLE reel, bouton Appeler gardien, refactoring devices.tsx

## Key Endpoints
- `/api/health/activity-streak`: Streak objectifs reels (GET, auth)
- `/api/health/body-age`: Age biologique Nora (GET, auth)
- `/api/health/daily-report`: Rapport quotidien avec activity_streak, body_age_nora, analysis_phase
- `/api/nora/morning-briefing`: Briefing matin Nora (GET, auth)

## Upcoming Tasks
- P0: Validation pesee BLE avec balance physique
- P1: Test iOS TestFlight BLE natif

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Affichage contrat PDF
- Badge gilet standby orange
- Deploiement production

## Key Files
- `frontend/app/(tabs)/health.tsx`: Page sante, carte activite + streak
- `frontend/src/components/health/HeroScore.tsx`: Age biologique Nora
- `frontend/src/components/dashboard/WeighingFlow.tsx`: Flux pesee BLE
- `backend/routes/health_report_routes.py`: Streaks + body-age + daily-report
- `backend/routes/advanced_routes.py`: Morning briefing + checkin
- `backend/services/nora_context.py`: Contexte IA enrichi
