# Chutex Care — PRD (Product Requirements Document)

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes.

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) + MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud, GPT-5.2

## Fonctionnalites implementees

### Age Biologique V2 (Mars 2026)
- Algorithme 3 niveaux: Bracelet seul (L1), Bracelet+Balance (L2), Tendances temporelles (L3)
- Scoring biomarqueur 0-100 normalise par normes cliniques OMS/AHA/ACE par age/sexe
- Ponderation scientifique: HRV 20-30%, graisse viscerale 20%, masse musculaire 15%, etc.
- Tendances 90 jours avec detection amelioration/degradation
- Fusion Nora IA (60%) + algorithme (40%) quand les deux disponibles
- Badges frontend: Niveau, Confiance, Tendance

### Live Activity + Carte GPS (Mars 2026)
- LiveAlertBanner style Uber Eats avec polling 5s, barre progression 6 etapes
- Carte CartoDB dark tiles avec marqueurs beneficiaire/intervenant
- ETA temps reel (Haversine + estimation arrivee)
- iOS ActivityKit (Dynamic Island + Lock Screen)
- Backend live_status_routes avec hooks dans alert_routes, vapi_engine, carewatch_engine

### Admin Dashboard (Mars 2026)
- Backoffice 9 modules, WebSocket alertes temps reel, Documents PDF

### Sante et Monitoring
- Glycemie ML V3, Balance Lefu, Gilet capteurs, Programme sante

### Alertes et Teleassistance
- SOS/Chute/Anomalie, VAPI IA, CareWatch, Escalade automatique

## Endpoints API cles
| Endpoint | Description |
|---|---|
| /api/health/aging-rate | Algorithme V2 age bio + rythme vieillissement |
| /api/health/body-age | Age biologique (Nora AI ou fallback) |
| /api/alerts/live-active | Statuts live actifs avec locations + ETA |
| /api/alerts/{id}/live-status | Statut live specifique |
| /ws/admin-alerts | WebSocket admin temps reel |

## Backlog
Voir ROADMAP.md
