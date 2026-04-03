# CHUTEX - PRD (Product Requirements Document)

## Probleme original
Application de sante connectee pour seniors et sportifs. Bracelet V8, balance Lefu, gilet anti-chute.
Frontend React Native Expo WebView + Backend FastAPI + MongoDB.

## Architecture
- **Frontend** : Hybride React Native (_layout.tsx bridge BLE natif) + WebView (95% de l'app)
- **Backend** : FastAPI, 518 routes, 40 fichiers de routes
- **DB** : MongoDB (86 collections)
- **IA** : GPT-5.2 via Emergent LLM Key
- **BLE** : Bridge natif iOS dans _layout.tsx (react-native-ble-plx)
- **Paiements** : Stripe + Mollie + Shopify

## Ce qui a ete implemente
- Auth complete (login, register, forgot password, roles multiples)
- Dashboard beneficiaire avec batch endpoint
- Bracelet V8 : bridge BLE natif iOS, push donnees (FC, SpO2, Tension, Stress, Sommeil, Glycemie)
- Balance Lefu : integration basique
- Modele ML glycemie (Gradient Boosting V3)
- Rapport sante quotidien (GPT-5.2)
- Morning briefing IA
- Systeme d'alertes et seuils personnalisables
- Gardiens avec invitations et WebSocket temps reel
- Programmes de reeducation
- Module Minceur
- Module Dorsi (bilan + exercices)
- Teleassistance
- Espace Pro (abonnements, exercices, repas)
- Espace SAAD / Entreprise
- Geofencing / Safe zones
- Contrats Mollie avec abonnements recurrents
- Systeme de notifications push

## Audit pre-production (03/04/2026) - COMPLETE
### 10 corrections appliquees :
1. Purge donnees simulees (utils.py)
2. BRACELET_SIM/SCALE_SIM -> BRACELET_METRICS/SCALE_METRICS
3. Route dupliquee auth/activate-beneficiary supprimee
4. Import duplique timedelta corrige
5. Import os manquant ajoute (subscription_routes)
6. Locations GPS simulees supprimees
7. Conflit webhook Mollie corrige (pro renomme)
8. check_anomalies defaults corriges
9. Code mort pushData supprime (_layout.tsx)
10. Navigation morning-briefing corrigee

### Resultats tests : Backend 20/20 PASS

## Backlog prioritise
### P0 (Avant production)
- Supprimer endpoint simulate-payment
- Nettoyer DB (alertes/readings test)
- Pre-calculer daily-report (perf)

### P1
- Refactoriser _layout.tsx (extraire BLE)
- Refactoriser health_report_routes.py
- Valider BLE sur iPhone physique (Build 91)
- Tests unitaires backend

### P2
- Configuration WiFi balance Lefu
- Serveur TCP J2358 production
- Hebergement HDS pour MongoDB
- Documentation API

### P3
- Gilet connecte
- Parrainage
- Essai gratuit 7j
- Test urinaire Vivoo
