# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" avec React Native (Expo), FastAPI, MongoDB.

## Architecture
- Frontend: React Native (Expo SDK 54) + expo-router
- Backend: FastAPI (Python) + MongoDB
- Paiement: Stripe natif (abonnements recurrents CB + SEPA + Connect)
- SMS: SMS Mode API
- Architecture native: New Architecture (Fabric/TurboModules)

## Accomplissements de cette session
### iOS
- Crash iOS RESOLU (builds 40-45) : newArchEnabled true, babel.config.js, react-native-worklets, fix hooks AuthScreen
- Build 45 complet (BLE + notifications + Face ID) pret a soumettre TestFlight

### Stripe & Facturation
- Stripe Connect active (Chutex plateforme + Chutex Care connected account + SAAD connected accounts)
- Abonnements recurrents mensuels (Subscriptions API)
- Paiement inline (Stripe Elements - CB + SEPA)
- Split automatique : 5EUR Chutex + reste Chutex Care
- Facture bracelet 130.80EUR TTC auto
- Commissions SAAD : oneshot (100/200EUR) ou mensuel (8/15EUR) selon plan
- Gestion impayes (3 tentatives, suspension)

### Landing page souscription
- 8 etapes, design blanc/violet, Stripe inline
- SMS auto beneficiaire + gardiens
- Correlation prescripteur automatique

### Espaces SAAD
- Codes prescripteur/intervention 6 chiffres auto-generes
- Activation prescripteur auto-lie le gardien a la SAAD
- Page agence avec onglets Agences + Gardiens
- Popup Stripe Connect + choix commissionnement
- Carte SAAD sur dashboard gardien + popup glass

### Blocage bracelet sans abonnement
- SubscriptionGate + SubscriptionBanner composants

## BUGS CONNUS A CORRIGER (priorite)
1. Popup agence : ne s'ouvre PAS en popup glass - le style `position:fixed` semble ne pas fonctionner dans le contexte tab
2. Popup Stripe config : meme probleme - pas rendu en glass
3. Fiche detail gardien (guardian-detail.tsx) : manque les informations complete (coordonnees, prescripteur oui/non, intervenant care oui/non) - affiche page vide/incomplete
4. Bouton "Message" inutile dans guardian-detail.tsx - a supprimer
5. Montant prescription validee dans espace SAAD : affiche 0EUR au lieu du montant commission
6. Fond blanc/gris persistant derriere certaines pages

## Comptes test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |
| SAAD | 0477101099 | demo123 |
| Code prescripteur SAAD | 489912 | - |
| Code intervention SAAD | 503645 | - |

## Stripe
- Chutex: acct_1T5OOnLlk70Z9YFU
- Chutex Care: acct_1T5OfJLqWmsf1vwj
- SAAD Test Lyon: acct_1T5PLDLfuCwYI3BC (commission mensuelle 8/15EUR)

## Taches a venir
1. P0: Corriger les 6 bugs ci-dessus
2. P0: Soumettre build 45 iOS a TestFlight
3. P1: Checkup page par page
4. P1: Popup detail commission dans profil SAAD (grille gains par type)
5. P2: Deploiement production chutex-innovation.com
6. P2: Audit i18n

## Fichiers cles modifies cette session
- frontend/app.json - newArchEnabled true, plugins
- frontend/babel.config.js - NOUVEAU
- frontend/app/_layout.tsx - fix hooks, routes
- frontend/app/index.tsx - fix useRef hooks order
- frontend/app/subscription.tsx - landing 8 etapes Stripe inline
- frontend/app/(tabs)/devices.tsx - prescriptions bracelet/gilet, commissions
- frontend/app/(tabs)/profile.tsx - carte Stripe SAAD, badge SAAD
- frontend/app/(tabs)/health.tsx - redirect agence pour SAAD
- frontend/app/company-agency.tsx - popup agence + gardiens
- frontend/src/components/dashboard/CompanyHome.tsx - codes, invitations, Stripe setup
- frontend/src/components/dashboard/GuardianHome.tsx - carte SAAD
- frontend/src/components/SubscriptionGate.tsx - NOUVEAU
- frontend/app/guardian-detail.tsx - fallback company prescriber API
- backend/routes/contract_routes.py - Stripe subscriptions + Connect + factures + SMS
- backend/routes/guardian_routes.py - saad-link fix, activate prescriber fix, SMS
- backend/routes/company_routes.py - prescriptions query fix
- backend/routes/auth_routes.py - codes 6 chiffres
- backend/auth.py - SAFE_FIELDS activation/intervention codes
