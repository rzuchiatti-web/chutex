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

## Changement de role (FIXED - Feb 14, 2026)
- Probleme: Contenu des pages ne se mettait pas a jour apres switch de role
- Solution: key={effectiveRole} sur Tabs (_layout.tsx) + chaque ecran tab (index.tsx, teleconsult.tsx, devices.tsx, alerts.tsx)
- Force un remount complet quand le role change

## Backoffice Admin (FIXED - Feb 14, 2026)
- Probleme: Codes d'activation/intervention sans champ `id` dans la DB (donnees seed)
- Solution: Migration DB pour ajouter id UUID, seed script mis a jour
- Probleme 2: useEffect avec [] ne re-fetche pas quand token disponible
- Solution: Dependance [token] avec guard if (!token) return
- Probleme 3: data-testid au lieu de testID (React Native Web)
- Solution: Remplacement par testID

## Refonte UX/UI Alertes & Interventions (DONE)
### Dashboard beneficiaire (index.tsx)
- Fetch `/api/alerts/active-with-interventions` toutes les 30s
- Carte alerte active EN HAUT avec type, message, heure, statut protocole, qui intervient
- Cloche notifications fonctionnelle avec dropdown alertes + invitations gardien

### Dashboard gardien (index.tsx)
- Fetch alertes actives toutes les 10s
- Alertes beneficiaires avec qui intervient (ex: "Ludivine Moutio en route")
- Cartes intervention en attente d'acceptation

### Carte Intervenant Care (teleconsult.tsx)
- Carte cliquable -> modal avec infos entreprise (structure, SIRET, adresse, rayon)
- Bouton desactiver dans le modal

### Page alertes (alerts.tsx)
- Tabs Actives/Resolues
- Cartes avec icone type, message, beneficiaire, heure, statut TA, intervenant
- Couleurs selon severite
- Auto-refresh 10s

### Page intervention-detail (intervention-detail.tsx)
- Statut mis a jour en temps reel (polling 5s)
- Infos beneficiaire + coordonnees GPS
- Timeline + rapport QCM
- Actions: Accepter/Cloturer

### Plateau d'ecoute IA (teleconsult.tsx pour teleassistance)
- Dashboard temps reel incidents CARE WATCH
- Stats en cours, resolus, dispatches, taux reponse
- Detail incident avec timeline + transcriptions

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
- P1: Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2: Reporting avance
- P3: Shopify (bloque sur plan utilisateur), Balance Lefu
- P3: Hypnogramme sommeil avec donnees reelles (actuellement simule)
