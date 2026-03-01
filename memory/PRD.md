# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe (payments + webhooks), Shopify (webhooks), OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
| Beneficiaire sans abo | 0600000099 | test123 |
| Admin | +33600000001 | (seeded) |

## Completed Features

### Mar 1, 2026 - Webhook Stripe + Cartes abonnement profil
**Backend - Stripe Webhook (`/api/webhook/stripe`):**
- `invoice.payment_succeeded` → reactive abonnement (contracts + subscriptions)
- `invoice.payment_failed` → suspend apres 3 tentatives, met a jour user.has_subscription
- `customer.subscription.deleted` → annule abonnement, met a jour user
- `customer.subscription.updated` → sync statut (active/past_due/canceled)

**Frontend - Page Profil:**
- Carte "Bracelet Elio" (fond bleu BG_BLUE) pour abonnement standard/bracelet_only
- Carte "Abonnement Care" (fond violet) pour abonnement care
- Popup glass unifiee avec details: type, formule, prix, telephone, date souscription, source
- Banner "Passer a Chutex Care" pour utilisateurs standard (upgrade)
- Fetch abonnement au chargement du profil (useEffect)
- Tests: 18/18 (12 backend + 6 frontend)

### Feb 28, 2026 - Infrastructure abonnement/activation (audit complet)
- Teleconsult: fond bleu plein ecran pour beneficiaires sans abonnement
- Devices: popup "Abonnement requis" quand clic "Associer" bracelet
- Dashboard DeviceCards: verification abonnement sur bouton Associer bracelet
- Fix dashboard-summary: valeurs reelles au lieu de hardcodees
- Late-linking: auto-liaison beneficiary_id par telephone
- Shopify webhook: liaison utilisateur existant, dates, types corrects

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (Resend)
- P2: Tests hardware BLE

## Future/Backlog
- Integration EBP comptable
- UI programmes groupe/equipe
- Mode hors-ligne intervenants
- Deploiement production (Dockerfile)

## Key Technical Notes
- Metro CI mode: `rm -rf /app/frontend/.metro-cache && sudo supervisorctl restart expo`
- Supervisor: `expo` pour frontend, `backend` pour backend
- Login API: POST /api/auth/login avec `email` (accepte telephones)
- Subscription lookup: beneficiary_id -> beneficiary_phone (normalise) -> late-link
