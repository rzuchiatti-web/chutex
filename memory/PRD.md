# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" avec React Native (Expo), FastAPI, MongoDB.

## Architecture
- Frontend: React Native (Expo SDK 54) + expo-router
- Backend: FastAPI (Python) + MongoDB
- Paiement: Stripe natif (abonnements recurrents CB + SEPA)
- SMS: SMS Mode API
- Architecture native: New Architecture (Fabric/TurboModules)

## Fonctionnalites implementees
- Auth complete / Glass-morphism UI / Chat IA (GPT-4o)
- Back-office admin / Alertes (Vapi.ai + SMS Mode)
- Gestion roles / RGPD / Dashboard / Popups appairage
- **Crash iOS RESOLU** (Build 45)
- **Landing souscription teleassistance** (8 etapes, Stripe inline, SMS)

## Stripe Integration (Vos cles)
- Abonnements recurrents mensuels (Stripe Subscriptions)
- Paiement inline (Stripe Elements - CB + SEPA)
- Gestion echecs: 3 tentatives, suspension apres echec, reactivation auto
- Webhooks: invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted
- Produits Stripe crees auto: bracelet 39.90EUR/mois, bracelet+gilet 79.90EUR/mois

## Landing Page (/subscription)
Design blanc/violet, images produits
- Etape 1: Choix formule (images bracelet/gilet, prix + credit impot 50%)
- Etape 2: Presentation enrichie (7 fonctionnalites)
- Etape 3: Pour soi/proche -> formulaire beneficiaire
- Etape 4: Type logement adaptatif, coffre cles, animal (liste)
- Etape 5: Gardiens multiples, lien (select), referent admin, consentement
- Etape 6: Livraison (date estimee)
- Etape 7: Contrat scrollable + signature + paiement Stripe inline
- Etape 8: Confirmation
- SMS auto au beneficiaire + gardiens apres paiement

## Statut
- iOS: Build 45 pret (soumettre TestFlight demain)
- Landing: COMPLETE avec Stripe inline + SMS
- Modules natifs: Reinstalles (BLE, notifications, biometrie)

## Taches a venir
1. P1: Soumettre build 45 a TestFlight
2. P1: Checkup page par page
3. P1: Deploiement production chutex-innovation.com
4. P2: Audit i18n

## Fichiers cles
- backend/routes/contract_routes.py - Stripe subscriptions + webhooks + SMS
- frontend/app/subscription.tsx - Landing 8 etapes + Stripe Elements inline
- backend/services/smsmode_service.py - Service SMS
