# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" - plateforme complete avec React Native (Expo) frontend, FastAPI backend, MongoDB.

## Architecture
- Frontend: React Native (Expo SDK 54) avec expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- Architecture native: **New Architecture** (Fabric/TurboModules)
- Paiement: Stripe (CB + SEPA)

## Fonctionnalites implementees
- Authentification complete (onboarding, login, register)
- Glass-morphism UI
- Morning Briefing / Chat IA (GPT-4o)
- Back-office admin refactore
- Alertes (Vapi.ai + SMS Mode)
- Gestion des roles (Beneficiaire, Gardien, SAAD, Admin, Teleassistance)
- RGPD / Protection des donnees
- Dashboard zero-data fix
- Popups glass appairage
- **Crash iOS RESOLU** (Build 45 avec BLE + Notifications + Face ID)
- **Landing page souscription contrat teleassistance** (8 etapes + Stripe)

## Page Souscription (NOUVEAU - Feb 2026)
Route: `/subscription` — Landing page multi-etapes pour souscription contrat teleassistance
- Etape 1: Choix formule (bracelet 39.9 EUR / bracelet+gilet 79.9 EUR + credit impot 50%)
- Etape 2: Detail du plan choisi
- Etape 3: Infos beneficiaire (pour soi / pour un proche, genre, nom, tel, adresse)
- Etape 4: Acces logement (etage, code, coffre a cles, animal)
- Etape 5: Gardiens (nom, tel, adresse, lien, proximite, cles) + ajout multiple
- Etape 6: Livraison (chez beneficiaire ou gardien, date estimee)
- Etape 7: Paiement & signature (choix personne a facturer, signature electronique, Stripe checkout CB/SEPA)
- Etape 8: Confirmation + prochaines etapes
- Backend: contract_routes.py (creation contrat, Stripe checkout, webhook, correlation prescripteur)
- Collections MongoDB: contracts, payment_transactions

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |

## Statut actuel
- Crash iOS: RESOLU (Build 45 pret, TestFlight demain — limite upload Apple)
- Landing souscription: IMPLEMENTEE (8 etapes + Stripe)
- Modules natifs: Reinstalles (BLE, notifications, biometrie)

## Taches a venir
1. P1: Soumettre build 45 a TestFlight (demain)
2. P1: Tests materiel natif (bracelet, balance, gilet)
3. P1: Checkup page par page (retours utilisateur)
4. P1: Audit i18n complet
5. P2: SMS automatiques aux gardiens lors souscription
6. P2: Integration Shopify du bouton "Souscrire" vers la landing

## Backlog
- UI programmes d'equipe/groupe
- Mode hors-ligne intervenants
- Fichiers deploiement production

## Fichiers cles
- `backend/routes/contract_routes.py` - API contrats + Stripe
- `frontend/app/subscription.tsx` - Landing page 8 etapes
- `frontend/app/index.tsx` - Fix hooks order
- `frontend/app.json` - newArchEnabled: true, plugins BLE/notif/biometrie
- `frontend/babel.config.js` - babel-preset-expo
