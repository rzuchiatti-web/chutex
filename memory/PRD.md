# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.
Objectif: transformer l'app en moteur de transformation sante et longevite guide, engageant et personnalise.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify (webhooks), OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone | Password | Notes |
|------|-------|----------|-------|
| SAAD | +33477101099 | demo123 | Test SAAD avec Stripe Connect |
| Guardian (Robin) | +33651245918 | (user set) | Abonnement Care actif |
| Beneficiaire sans abo | 0600000099 | test123 | Marie Test - pas d'abonnement |
| Admin | +33600000001 | (seeded) | Directeur Chutex |

## Completed Features

### Feb 28, 2026 - P0 UI Fix (no-subscription users)
- Page /teleconsult: fond bleu plein ecran avec message "Abonnement requis" pour beneficiaires sans abonnement (position: fixed, BG_BLUE)
- Page /devices: popup detaillee "Abonnement requis" avec 2 options (Bracelet Elio 24.90 EUR/mois, Chutex Care 39.90 EUR/mois) quand clic sur "Associer" bracelet
- Resolution du probleme de cache Metro (CI mode) - necessaire de clear cache + restart expo pour appliquer les changements
- Seeding des appareils pour Marie Test (bracelet, balance, gilet)
- Tests: 9/9 passes (backend + frontend)

### Earlier (Previous Sessions)
- Onboarding SAAD 2 etapes (commission + Stripe Connect)
- Integration Shopify webhook complete (order -> Stripe subscription)
- Upgrade Nora IA vers GPT-5.2
- Profil multi-roles + activation espace beneficiaire
- Corrections UI/UX SAAD et Guardian (popups glass, navigation, commissions)
- Composant PhoneInputWithPrefix reutilisable
- Page prescripteur avec challenge/recompenses
- Systeme d'alertes et teleassistance IA

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (integration Resend)
- P2: Tests hardware natifs complets (BLE bracelet, balance, gilet)

## Future/Backlog
- Integration logiciel comptable EBP
- UI pour programmes groupe/equipe
- Mode hors-ligne pour intervenants
- Preparation deploiement production (Dockerfile, docker-compose)
- Centraliser logique subscription dans un hook custom (useSubscriptionStatus)

## Key Technical Notes
- Metro bundler CI mode: `rm -rf /app/frontend/.metro-cache && sudo supervisorctl restart expo` pour forcer rebuild
- Supervisor: `expo` (pas `frontend`) pour le service frontend
- Login API: POST /api/auth/login avec `email` (accepte aussi les numeros de telephone)
