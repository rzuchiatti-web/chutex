# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key)
- Voix: ElevenLabs (multilingual_v2)
- Telephonie: Twilio (appels, speech recognition FR-FR)

## CARE WATCH - Moteur Orchestration (DONE)
- Machine a etats: NEW_ALERT -> CALLING_PATIENT -> PATIENT_OK/NEEDS_HELP/NO_RESPONSE -> CALLING_GUARDIAN_1/2/N -> GUARDIAN_ACCEPTED/UNREACHABLE -> CARE_DISPATCHED -> RESOLVED
- Scripts vocaux dynamiques avec variantes
- Classification NLP GPT-5.2: intent_ok, intent_help, intent_uncertain, no_speech, voicemail_detected
- Fichiers: carewatch_config.py, carewatch_engine.py, carewatch_routes.py

## Menu flottant (DONE)
- CSS injecte `position: fixed` sur `[role="tablist"]` via useEffect dans _layout.tsx
- Fonctionne sur toutes les pages

## EN COURS - Refonte UX/UI Alertes & Interventions
### Backend ajoute
- GET /api/alerts/active-with-interventions - retourne alertes actives enrichies avec interventions et infos intervenant

### A FAIRE (prochain fork)
1. **Dashboard beneficiaire** (index.tsx BeneficiaryHome):
   - Ajouter fetch `/api/alerts/active-with-interventions` dans fetchData
   - Afficher carte alerte active EN HAUT du dashboard (avant SOS) avec: type, message, heure, statut protocole, qui intervient
   - Carte disparait quand alerte resolue
   - Bouton cloche -> ouvre modal notifications (alertes actives, interventions en cours)

2. **Dashboard gardien** (index.tsx GuardianHome):
   - Meme fetch alertes actives
   - Voir alertes beneficiaires avec qui intervient (ex: "Ludivine Moutio en route")
   - Statut intervention mis a jour en temps reel

3. **Carte Intervenant Care** (teleconsult.tsx GuardianInterventions):
   - Rendre la carte cliquable -> modal avec infos entreprise (nom, SIRET, adresse, rayon)
   - Bouton desactiver dans le modal
   - Code deja fait partiellement mais pas modal

4. **Page alertes redesignee** (alerts.tsx):
   - Chaque carte alerte = infos claires: icone type, message, beneficiaire, heure, statut TA, intervenant
   - Couleurs selon severite

5. **Page intervention-detail** (intervention-detail.tsx):
   - Statut mis a jour en temps reel
   - Infos intervenant avec coordonnees

## Comptes de test
| Role | Email | MdP | Localisation |
|---|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 | Saint-Chamond (45.47, 4.51) |
| Gardien | claire.martin@email.fr | demo123 | - |
| Intervenant Care | ludivine.moutio@care.fr | demo123 | Saint-Etienne (45.44, 4.39) |
| Intervenant Care Paris | sophie.bernard@care-paris.fr | demo123 | Paris (48.86, 2.35) |
| Teleassistance | plateau@chutex.fr | demo123 | - |
| Admin | admin@chutex.fr | demo123 | - |

## Backlog
- P1: Dashboard Plateau d'ecoute frontend (teleconsult.tsx pour teleassistance)
- P1: Reporting avance
- P2: Build natif Android/iOS + BLE
- P3: Shopify, Balance Lefu
