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

### Feb 28, 2026 - Infrastructure abonnement/activation (audit complet)
**Frontend:**
- Page /teleconsult: fond bleu plein ecran (BG_BLUE, position:fixed) pour beneficiaires sans abonnement
- Page /devices: popup "Abonnement requis" avec 2 options quand clic "Associer" bracelet
- Dashboard DeviceCards: bouton "Associer" bracelet verifie l'abonnement, affiche popup si pas d'abo
- Fix critique: /api/devices/dashboard-summary retournait connected=true et battery hardcodees - corrige pour lire les valeurs reelles de la DB
- Les appareils non connectes affichent "Non associe" avec bouton Associer
- Tests: 15/16 passes (backend 9/9 + frontend 6/7, le 7e corrige ensuite)

**Backend:**
- Late-linking: /api/subscriptions/my lie automatiquement beneficiary_id quand subscription trouvee par telephone
- Shopify webhook: lie beneficiary_id a l'utilisateur existant si le telephone correspond
- Shopify webhook: subscription_type = "care" pour produits bracelet_gilet, "bracelet_only" sinon
- Shopify webhook: stocke start_date, buyer_name, buyer_email, product_name
- has_teleassistance = true pour types "care" et "bracelet_gilet"
- Retourne start_date et source dans /api/subscriptions/my

**Flux d'abonnement verifie:**
1. Utilisateur cree compte beneficiaire (pas d'abo) -> teleconsult bloque, bracelet bloque
2. Achat Shopify bracelet -> webhook cree subscription avec phone -> detection automatique au prochain appel /api/subscriptions/my
3. Achat Shopify Care (bracelet+gilet) -> subscription_type="care" -> teleassistance activee
4. Late-linking: si abo cree avant le compte, beneficiary_id est lie au premier appel

### Earlier Sessions
- Onboarding SAAD 2 etapes + Stripe Connect
- Integration Shopify webhook complete
- Upgrade Nora IA vers GPT-5.2
- Profil multi-roles + activation espace beneficiaire
- Corrections UI/UX SAAD et Guardian

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (integration Resend)
- P2: Tests hardware natifs complets (BLE bracelet, balance, gilet)

## Future/Backlog
- Integration logiciel comptable EBP
- UI pour programmes groupe/equipe
- Mode hors-ligne pour intervenants
- Preparation deploiement production (Dockerfile, docker-compose)

## Key Technical Notes
- Metro CI mode: `rm -rf /app/frontend/.metro-cache && sudo supervisorctl restart expo` pour rebuild
- Supervisor: `expo` pour frontend, `backend` pour backend
- Login API: POST /api/auth/login avec `email` (accepte aussi telephones)
- Subscription check: cherche par beneficiary_id puis par beneficiary_phone (normalise)
