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

### Mar 1, 2026 - Nora AI Contextuelle & Intelligente
**Service contexte enrichi (`services/nora_context.py`):**
- Aggregation complete du profil utilisateur: age, genre, pathologies, appareils, abonnement, programmes actifs
- Recommandations intelligentes basees sur le profil:
  - +75 ans sans Care → recommande teleassistance
  - Pas de balance → recommande Balance Vita
  - Pas de programme → recommande programme adapte
  - Hypertension → recommande programme tension
- Base de connaissance des services Chutex (APP_SERVICES_KNOWLEDGE)

**Backend - Reponses coherentes sans donnees:**
- `gen_ai()` retourne correlations=[], whats_good=[], watch_out=[] quand aucune donnee
- `get_section_analysis()` retourne no_data:true avec recommendation adaptee
- Plus JAMAIS de "Points forts" ou "A surveiller" sans donnees reelles
- Recommandations secondaires intelligentes (abonnements, appareils, programmes)

**Backend - Chat Nora enrichi:**
- Prompt systeme inclut APP_SERVICES_KNOWLEDGE complet
- Nora connait les abonnements, appareils et programmes
- Recommandations contextuelles dans le chat (ex: +75 ans → Care)
- Nora dit clairement quand elle n'a pas de donnees au lieu de fabriquer

**Backend - Programmes enrichis:**
- Daily feedback utilise le contexte Nora complet
- Feedback adapte si donnees absentes vs presentes
- Conseils scientifiques pour longevite et prevention

**Frontend - Health pages coherentes:**
- health-detail.tsx: Plus de sections "Points forts"/"A surveiller" vides
- health-detail.tsx: Affiche la recommendation Nora quand no_data
- health.tsx: Page no-data montre les recommandations Nora personnalisees
- Remplacement "Balance Lefu" par "Balance Vita" sur page no-data

### Mar 1, 2026 - Emails transactionnels Mailjet
- 5 types d'emails: bienvenue, confirmation souscription, invitation gardien, echec paiement, resiliation
- Integration Mailjet API

### Mar 1, 2026 - Gestion complete d'abonnement
- Page dediee avec 4 onglets, infos logement, gardiens, paiement, resiliation
- Stripe Customer Portal, webhooks

### Feb 28, 2026 - Infrastructure abonnement/activation
- Verification abonnement coherente
- Shopify/Stripe webhooks

## Upcoming Tasks
- P0: Soumettre iOS Build sur TestFlight
- P1: Tests hardware BLE complets
- P2: Enrichir les programmes (commencer par sommeil - contenu scientifique plus personnalise)

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
- EMERGENT_LLM_KEY: OpenAI GPT-5.2 via Emergent

## Key Files
- `backend/services/nora_context.py`: Contexte IA enrichi + base de connaissance services
- `backend/routes/health_report_routes.py`: Rapport quotidien + analyse par section
- `backend/routes/chat_routes.py`: Chat Nora avec contexte complet
- `backend/routes/program_routes.py`: Programmes de prevention
- `frontend/app/health-detail.tsx`: Detail de section sante
- `frontend/app/(tabs)/health.tsx`: Page sante principale
