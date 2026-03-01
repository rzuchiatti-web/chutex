# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe (payments + webhooks + billing portal), Shopify (webhooks), Mailjet (emails transactionnels), OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
| Beneficiaire sans abo | 0600000099 | test123 |
| Admin | +33600000001 | (seeded) |

## Completed Features

### Mar 1, 2026 - Emails transactionnels Mailjet
**Service email (`services/email_service.py`):**
- Templates HTML structures avec branding Chutex (logo, couleurs, footer)
- 5 types d'emails: bienvenue, confirmation souscription, invitation gardien, echec paiement, resiliation
- Envoi asynchrone via `asyncio.create_task` (non-bloquant)
- Integration: `mailjet-rest` v1.5.1
- Teste et verifie: Mailjet API status 200 OK

**Integration dans les flux existants:**
- `POST /api/auth/register` → email de bienvenue
- Shopify webhook → email confirmation de souscription
- `POST /api/subscriptions/my/cancel` → email de resiliation
- Stripe webhook → email echec de paiement (via contract_routes)

### Mar 1, 2026 - Gestion complete d'abonnement
- Popup gestion avec 4 onglets (Care) / 2 (Standard)
- Infos logement, code boite a cles, gardiens/escalade, paiement, resiliation
- Backend: update-info, cancel, billing-portal, pending-invites, resend-invite

### Feb 28, 2026 - Infrastructure abonnement/activation
- Teleconsult/Devices/Dashboard: verification abonnement coherente
- Late-linking, Shopify webhook ameliore, Stripe webhook etendu

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P2: Tests hardware BLE

## Future/Backlog
- Historique des paiements (factures Stripe)
- Integration EBP comptable
- UI programmes groupe/equipe
- Mode hors-ligne intervenants
- Deploiement production (Dockerfile)

## Key API Keys (backend/.env)
- MJ_APIKEY_PUBLIC / MJ_APIKEY_PRIVATE: Mailjet
- STRIPE_API_KEY: Stripe
- SHOPIFY_WEBHOOK_SECRET: Shopify
