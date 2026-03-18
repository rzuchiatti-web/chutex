# Chutex Care — PRD (Product Requirements Document)

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes. Elle permet le suivi de sante, la detection de chutes, les alertes SOS, et la coordination entre beneficiaires, gardiens, et agences SAAD.

## Personas
- **Beneficiaire**: Personne agee portant un bracelet connecte, surveillee par l'application
- **Gardien**: Proche ou aidant, recevant les alertes et pouvant intervenir
- **Admin**: Gestionnaire de la plateforme, acces au backoffice complet
- **Teleassistance (Nora IA)**: Systeme automatise de gestion des alertes

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) 
- **Base de donnees**: MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud

## Fonctionnalites implementees

### Infrastructure et Auth
- Authentification JWT (login/register/refresh)
- Gestion des roles (beneficiaire, gardien, admin, teleassistance)
- Systeme d'invitations gardien-beneficiaire

### Sante et Monitoring
- Suivi glycemie avec ML V3 (random forest + gradient boosting)
- Balance connectee (Lefu Cloud)
- Gilet connecte avec capteurs
- Programme de sante personnalise
- Rapports de pesee

### Alertes et Teleassistance
- Systeme d'alertes SOS / Chute / Anomalie sante
- Moteur VAPI (appels IA vocaux)
- Moteur CareWatch (Twilio + ElevenLabs)
- Escalade automatique: Patient → Gardiens → SAAD
- Gestion des interventions

### Live Activity + Carte temps reel (Mars 2026)
- **Backend Live Status**: Tracking en 6 etapes (alert_triggered → notifying_guardians → ai_calling → guardian_responding → intervention_active → resolved)
- **In-App Live Activity**: Composant LiveAlertBanner style Uber Eats avec glassmorphism, barre de progression, timeline, stage chips, boutons d'action
- **Carte de localisation**: CartoDB dark tiles 3x3, marqueur beneficiaire avec coordonnees GPS, marqueur intervenant (quand disponible), ligne en pointilles de route
- **iOS Native Live Activities**: Configuration ActivityKit (ChutexAlertLiveActivity.swift + LiveActivityModule.swift) pour Dynamic Island et Lock Screen
- **Push enrichies**: Payloads avec flag live_activity, donnees beneficiaire
- **Endpoints**: GET /api/alerts/live-active, GET /api/alerts/{id}/live-status, POST /api/push/live-activity-token
- Hooks automatiques dans alert_routes, vapi_engine, carewatch_engine
- Auto-polling toutes les 5 secondes

### Admin Dashboard
- Backoffice complet avec 9 modules
- KPIs et graphiques temps reel
- Alertes WebSocket (/ws/admin-alerts)
- Export PDF documents techniques
- Interface sidebar professionnelle

## Endpoints API cles
| Endpoint | Methode | Description |
|---|---|---|
| /api/auth/login | POST | Connexion |
| /api/alerts | POST/GET | Gestion alertes |
| /api/alerts/live-active | GET | Statuts live actifs avec locations |
| /api/alerts/{id}/live-status | GET | Statut live specifique |
| /api/alerts/{id}/tracking | GET | Positions beneficiaire + intervenant |
| /api/push/live-activity-token | POST | Token APNs iOS |
| /ws/admin-alerts | WS | Alertes admin temps reel |

## Schema DB
- `users`, `alerts`, `incidents`, `interventions`
- `alert_live_status`: Suivi temps reel des etapes d'alerte
- `alert_tracking`, `intervention_tracking`: Positions GPS
- `live_activity_tokens`: Tokens APNs pour Live Activities iOS
- `locations`: Derniere position connue par utilisateur

## Backlog
Voir ROADMAP.md pour les fonctionnalites prioritaires.
