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

### Live Activity (Notifications temps reel) — NOUVEAU (Mars 2026)
- **Backend**: Systeme de suivi live status avec 6 etapes (alert_triggered → notifying_guardians → ai_calling → guardian_responding → intervention_active → resolved)
- **Frontend In-App**: Composant LiveAlertBanner style Uber Eats avec barre de progression, timeline, boutons d'action (Suivre, Intervenir, Appeler)
- **iOS Native**: Configuration ActivityKit (ChutexAlertLiveActivity.swift + LiveActivityModule.swift) pour Dynamic Island et Lock Screen
- **Push enrichies**: Payloads push avec flag live_activity et donnees beneficiaire
- **Endpoints**: GET /api/alerts/live-active, GET /api/alerts/{id}/live-status, POST /api/push/live-activity-token
- Auto-polling toutes les 5 secondes pour mises a jour temps reel

### Admin Dashboard
- Backoffice complet avec 9 modules (Utilisateurs, Alertes, Abonnements, Appareils, Sante, Programmes, Systeme, Documents)
- KPIs et graphiques en temps reel
- Alertes WebSocket temps reel (/ws/admin-alerts)
- Export PDF de documents techniques
- Interface sidebar professionnelle

### Documents et Brevets
- Brevet V3 Glycemia ML Algorithm (complet)
- Navigateur de documents avec export PDF

## Endpoints API cles
| Endpoint | Methode | Description |
|---|---|---|
| /api/auth/login | POST | Connexion |
| /api/alerts | POST/GET | Gestion des alertes |
| /api/alerts/live-active | GET | Statuts live actifs |
| /api/alerts/{id}/live-status | GET | Statut live specifique |
| /api/push/live-activity-token | POST | Token APNs iOS |
| /ws/admin-alerts | WS | Alertes admin temps reel |
| /api/admin/* | GET | Endpoints admin dashboard |

## Schema DB principal
- `users`: Utilisateurs (beneficiaire, gardien, admin)
- `alerts`: Alertes SOS/chute/anomalie
- `alert_live_status`: Suivi temps reel des etapes d'alerte (NOUVEAU)
- `incidents`: Incidents teleassistance
- `interventions`: Interventions gardien/SAAD
- `live_activity_tokens`: Tokens APNs pour Live Activities iOS (NOUVEAU)

## Backlog
Voir ROADMAP.md pour les fonctionnalites prioritaires.
