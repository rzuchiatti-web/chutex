# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key) - classification vocale, analyse intention
- Voix: ElevenLabs (multilingual_v2) - voix naturelle francaise
- Telephonie: Twilio (appels, speech recognition FR-FR)
- i18n: FR, EN, DE, ES, IT

## CARE WATCH - Plateau d'ecoute IA (Session 11, Feb 13 2026)
### Moteur d'orchestration
- Machine a etats: NEW_ALERT → CALLING_PATIENT → PATIENT_OK/NEEDS_HELP/NO_RESPONSE → CALLING_GUARDIAN_1 → CALLING_GUARDIAN_2 → GUARDIAN_ACCEPTED/UNREACHABLE → CARE_DISPATCHED → RESOLVED
- Scripts vocaux dynamiques avec variantes (naturalite)
- Classification NLP: intent_ok, intent_help, intent_uncertain, no_speech, voicemail_detected
- Parametres configurables: ring_timeout, max_reformulations, speech_timeout
- Journalisation complete avec horodatage (collection `incidents`)

### Fichiers cles
- `/app/backend/services/carewatch_config.py` - Config + scripts vocaux + machine a etats
- `/app/backend/services/carewatch_engine.py` - Moteur d'orchestration (carewatch_orchestrate)
- `/app/backend/routes/carewatch_routes.py` - API + webhooks Twilio (patient/guardian response)
- `/app/backend/routes/alert_routes.py` - Declencheur (severity high/critical → carewatch_orchestrate)

### API Endpoints
- GET /api/carewatch/incidents - Liste incidents
- GET /api/carewatch/incidents/active - Incidents actifs
- GET /api/carewatch/incident/{id} - Detail incident
- POST /api/carewatch/incident/{id}/note - Ajouter note operateur
- POST /api/carewatch/incident/{id}/takeover - Reprise en main
- POST /api/carewatch/incident/{id}/resolve - Cloturer
- GET /api/carewatch/stats - Statistiques
- GET /api/carewatch/config - Configuration
- PUT /api/carewatch/config - Modifier config
- POST /api/carewatch/patient-response - Webhook Twilio patient
- POST /api/carewatch/patient-reformulation - Webhook reformulation
- POST /api/carewatch/guardian-response - Webhook Twilio gardien

## Backlog
- P0: Dashboard frontend "Plateau d'ecoute" (teleconsult.tsx pour role teleassistance)
- P1: Reporting avance (taux reponse, temps moyen, graphiques)
- P1: Animation switch profil
- P2: Build natif Android/iOS + BLE
