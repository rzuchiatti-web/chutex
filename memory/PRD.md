# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" avec React Native (Expo), FastAPI, MongoDB.

## Architecture
- Frontend: React Native (Expo SDK 54) + expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- Paiement: Stripe (CB + SEPA via emergentintegrations)
- SMS: SMS Mode API
- Architecture native: New Architecture (Fabric/TurboModules)

## Fonctionnalites implementees
- Authentification complete (onboarding, login, register)
- Glass-morphism UI / Chat IA (GPT-4o)
- Back-office admin / Alertes (Vapi.ai + SMS Mode)
- Gestion des roles / RGPD
- Dashboard zero-data fix / Popups appairage
- **Crash iOS RESOLU** (Build 45)
- **Landing page souscription teleassistance** (8 etapes + Stripe + SMS)

## Landing Page Souscription (/subscription)
Design: Fond blanc, cartes grises, accent violet (#7C3AED)
- Etape 1: Choix formule avec images produits (bracelet 39.9EUR / bracelet+gilet 79.9EUR)
- Etape 2: Presentation enrichie (7 fonctionnalites detaillees)
- Etape 3: Pour soi/pour un proche -> formulaire beneficiaire (champs obligatoires *)
- Etape 4: Type logement (Appartement/Maison/Residence senior) + adaptif, coffre cles, animal (liste)
- Etape 5: Gardiens multiples, lien (select), referent administratif, consentement
- Etape 6: Livraison (chez beneficiaire ou gardien, date estimee)
- Etape 7: Contrat scrollable + signature electronique + Stripe Checkout
- Etape 8: Confirmation
- Backend: contract_routes.py - Stripe, webhook, correlation prescripteur, SMS auto
- SMS: Beneficiaire + chaque gardien notifies apres paiement

## Statut actuel
- Crash iOS: RESOLU (Build 45 a soumettre TestFlight)
- Landing souscription: COMPLETE (design blanc/violet, Stripe, SMS)
- Modules natifs: Reinstalles (BLE, notifications, biometrie)

## Comptes test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |

## Taches a venir
1. P1: Soumettre build 45 iOS a TestFlight
2. P1: Checkup page par page (retours utilisateur)
3. P1: Deploiement production sous chutex-innovation.com
4. P2: Audit i18n complet

## Backlog
- Paiement Stripe inline (Elements) au lieu du redirect
- Tests materiels BLE
- UI programmes equipe/groupe
- Mode hors-ligne intervenants

## Fichiers cles
- backend/routes/contract_routes.py - API contrats + Stripe + SMS
- frontend/app/subscription.tsx - Landing page 8 etapes
- frontend/app/index.tsx - Fix hooks order
- frontend/app.json - newArchEnabled: true, plugins BLE/notif/biometrie
- backend/services/smsmode_service.py - Service SMS
