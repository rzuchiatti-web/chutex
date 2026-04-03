# CHUTEX - PRD (Product Requirements Document)

## Probleme original
Application de sante connectee pour seniors et sportifs. Bracelet V8, balance Lefu, gilet anti-chute.
Frontend React Native Expo WebView + Backend FastAPI + MongoDB.

## Architecture
- **Frontend** : Hybride React Native (_layout.tsx bridge BLE natif) + WebView (95% de l'app)
- **Backend** : FastAPI, 518 routes, 40 fichiers de routes, 46K lignes Python
- **DB** : MongoDB (86 collections)
- **IA** : GPT-5.2 via Emergent LLM Key
- **BLE** : Bridge natif iOS — module `bleV8Bridge.ts` (326 lignes)
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
### 13 corrections + 4 refactorisations :
1. Purge donnees simulees (utils.py)
2. BRACELET_SIM -> BRACELET_METRICS (sets purs)
3. Route dupliquee auth/activate-beneficiary supprimee
4. Import duplique timedelta corrige
5. Import os manquant ajoute (subscription_routes)
6. Locations GPS simulees supprimees (misc_routes)
7. Conflit webhook Mollie corrige (pro renomme)
8. check_anomalies defaults corriges (0 au lieu de 75/97)
9. Code mort pushData supprime (_layout.tsx)
10. Navigation morning-briefing corrigee (router.replace + useRouter)
11. Cache intelligent daily-report (0.13s vs 5-8s)
12. Pre-computation background (toutes les 4h)
13. Endpoint simulate-payment supprime

### Refactorisations :
- health_core.py (297L) extrait de health_report_routes.py
- pro_exercise_routes.py (502L) extrait de professional_routes.py (-554L)
- bleV8Bridge.ts (326L) extrait de _layout.tsx (-208L, de 560 a 352)
- 248 fausses alertes supprimees de la DB

### Tests : 28/28 pytest PASS

## Backlog prioritise
### P0 - DONE
### P1 - DONE
- [x] Extraction health_core.py
- [x] Extraction pro_exercise_routes.py
- [x] Extraction bleV8Bridge.ts
- [x] Suite pytest 28 tests
- [x] Nettoyage DB (248 fausses alertes)
- [ ] Valider BLE sur iPhone physique (Build 91)

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
