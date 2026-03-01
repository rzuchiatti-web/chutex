# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe (payments + webhooks + billing portal), Shopify (webhooks), OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
| Beneficiaire sans abo | 0600000099 | test123 |
| Admin | +33600000001 | (seeded) |

## Completed Features

### Mar 1, 2026 - Gestion complete d'abonnement
**Backend - Nouveaux endpoints:**
- `PUT /api/subscriptions/my/update-info` - MAJ infos logement (adresse, etage, digicode, code boite a cles)
- `POST /api/subscriptions/my/cancel` - Resiliation (Stripe + DB + user)
- `POST /api/subscriptions/my/billing-portal` - Portail Stripe pour modifier carte
- `GET /api/guardians/pending-invites` - Invitations gardiens en attente
- `POST /api/guardians/resend-invite` - Renvoyer SMS d'inscription gardien

**Backend - Stripe Webhook etendu (`/api/webhook/stripe`):**
- `invoice.payment_succeeded` → reactive abonnement (contracts + subscriptions + user)
- `invoice.payment_failed` → suspend apres 3 tentatives
- `customer.subscription.deleted` → annule abonnement
- `customer.subscription.updated` → sync statut (active/past_due/canceled)

**Frontend - SubscriptionManagePopup (nouveau composant):**
- 4 onglets pour Care: Abonnement, Logement, Gardiens, Paiement
- 2 onglets pour Standard: Abonnement, Paiement
- Onglet Abonnement: type, formule, prix, date, source, features incluses, upgrade banner (standard→care)
- Onglet Logement: adresse, CP, ville, etage, digicode, interphone, code boite a cles (highlight special), notes
- Onglet Gardiens: liste ordonnee avec escalade (monter/descendre), invitations en attente avec "Renvoyer" SMS, "Aucun gardien" message si vide
- Onglet Paiement: portail Stripe, recapitulatif, resiliation avec confirmation

**Frontend - Cartes profil:**
- Carte Care (fond violet) / Carte Standard (fond bleu BG_BLUE)
- Fetch subData au chargement (useEffect)

### Feb 28, 2026 - Infrastructure abonnement/activation
- Teleconsult: fond bleu plein ecran sans abonnement
- Devices: popup abonnement bracelet
- Dashboard DeviceCards: verification abonnement
- Fix dashboard-summary: valeurs reelles DB
- Late-linking: auto-liaison beneficiary_id
- Shopify webhook: liaison utilisateur, dates, types corrects

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (Resend)
- P2: Tests hardware BLE

## Future/Backlog
- Historique des paiements (factures Stripe)
- Integration EBP comptable
- UI programmes groupe/equipe
- Mode hors-ligne intervenants
- Deploiement production (Dockerfile)
