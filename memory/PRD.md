# CHUTEX - PRD (Product Requirements Document)

## Probleme original
Application de sante connectee pour seniors et sportifs. Bracelet V8, balance Lefu, gilet anti-chute.
Frontend React Native Expo WebView + Backend FastAPI + MongoDB.

## Architecture
- **Frontend** : Hybride React Native (_layout.tsx bridge BLE natif) + WebView (95% de l'app)
- **Backend** : FastAPI, 518 routes, 40 fichiers de routes, 46K lignes Python
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
- Rapport sante quotidien (GPT-5.2) avec CACHE intelligent (83x plus rapide)
- Morning briefing IA
- Systeme d'alertes et seuils personnalisables
- Gardiens avec invitations et WebSocket temps reel
- Programmes de reeducation
- Module Minceur + Dorsi
- Teleassistance + Espace Pro/SAAD
- Geofencing / Safe zones
- Contrats Mollie

## Audit pre-production (03/04/2026) - COMPLETE
### 13 corrections appliquees :
1. Purge donnees simulees (utils.py)
2. BRACELET_SIM -> BRACELET_METRICS (sets purs)
3. Route dupliquee auth/activate-beneficiary supprimee
4. Import duplique timedelta corrige
5. Import os manquant ajoute (subscription_routes)
6. Locations GPS simulees supprimees (misc_routes)
7. Conflit webhook Mollie corrige (pro renomme)
8. check_anomalies defaults corriges (0 au lieu de 75/97)
9. Code mort pushData supprime (_layout.tsx)
10. Navigation morning-briefing corrigee (router.replace)
11. Cache intelligent daily-report (0.13s vs 5-8s)
12. Pre-computation background (toutes les 4h)
13. Endpoint simulate-payment supprime

### Optimisation performance :
- Daily report : 5-8s -> 0.13s (cache MongoDB, invalidation sur push, precompute 4h)
- Bug uid non defini dans PDF report corrige

### Resultats tests : Backend 20/20 PASS

## Backlog prioritise
### P0 (Avant production) - DONE
- [x] Purge donnees simulees
- [x] Routes dupliquees
- [x] Cache daily-report
- [x] Suppression simulate-payment

### P1
- [ ] Refactoriser _layout.tsx (extraire BLE dans module separe)
- [ ] Refactoriser health_report_routes.py (2064L)
- [ ] Refactoriser professional_routes.py (2496L)
- [ ] Valider BLE sur iPhone physique (Build 91)
- [ ] Tests unitaires backend (pytest)

### P2
- [ ] Configuration WiFi balance Lefu
- [ ] Serveur TCP J2358 production
- [ ] Hebergement HDS pour MongoDB
- [ ] Documentation API

### P3
- [ ] Gilet connecte
- [ ] Parrainage
- [ ] Essai gratuit 7j
- [ ] Test urinaire Vivoo
