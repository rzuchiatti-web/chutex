# Chutex Care — PRD (Product Requirements Document)

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes.

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) + MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud, GPT-5.2

## Fonctionnalites implementees

### Dashboard Beneficiaire Design Clinique (Mars 2026)
- Fond anime Canvas: gris fonce (#1e1e30) avec 5 orbes violettes lumineuses (hue 260-295) qui pulsent et bougent + 40 particules violettes avec glow
- 4 cartes objectifs journaliers style Apple Watch: barres segmentees (30 segments), gradient d'accent, grandes valeurs
  - Calories: accent jaune-vert #C8D84C, Hydratation: cyan #22D3EE, Pas: vert #10B981, Coucher: violet #A78BFA
- Cartes glass rgba(30,30,48,0.85) avec bordures rgba(255,255,255,0.1), border-radius 20px
- Variables CSS heritees par composants enfants (DailyObjectives, DeviceCards)

### Bracelet V8 JStyle (Fevrier 2026)
- Connexion BLE Web Bluetooth (JStyle SDK V8: 0xFFF0 service)
- Push data types: heart_rate, spo2, temperature (3-NTC), steps, blood_pressure, ecg, ecg_result, blood_glucose, ppg
- Glycemie estimee PPG multi-spectral (mg/dL + mmol/L)
- Analyse ECG complete: FC, HRV, respiration, stress, humeur, age vasculaire, tension
- VO2max calcul Uth-Sorensen-Overgaard-Pedersen (normes ACSM par age/sexe)
- Detection anomalies: FC, SpO2, glycemie haute/basse → alertes auto
- Consolidated readings pour compatibilite age bio + correlations + ML
- Dashboard V8: vitals temps reel + glucose + ECG + VO2max
- Historique ECG et glycemie
- Mode simulation V8 complet (8s interval)
- 15 modes sport

### Correlations Sante (Fevrier 2026)
- Endpoint `/api/health/correlations` — Calcul Pearson sur 90 jours entre metriques
- Endpoint `/api/health/correlations/trends` — Evolution hebdomadaire des correlations (8 semaines glissantes)
- 19 paires de metriques (cardio, sommeil, activite, composition, metabolisme)
- Agregation quotidienne des lectures bracelet + balance
- Filtrage correlations faibles (|r| < 0.15), tri par force decroissante
- 4 niveaux de force: faible, moderee, forte, tres_forte
- Tendances: Renforce/Stable/Affaibli avec delta % et sparklines SVG
- Insights AI personnalises via GPT-5.2 (Nora IA)
- UI: CorrelationsCard.tsx avec onglets Actuelles/Tendances, sparklines, badges direction

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
| /api/bracelet/v8/config | Config BLE V8 (UUIDs, commandes, modes sport) |
| /api/bracelet/v8/push | Reception donnees V8 (FC, ECG, glycemie, PPG, temp) |
| /api/bracelet/v8/dashboard | Dashboard vitals complet V8 |
| /api/bracelet/v8/vo2max | Calcul VO2max (Uth-Sorensen + ACSM) |
| /api/bracelet/v8/ecg-history | Historique ECG waveform + resultats |
| /api/bracelet/v8/glucose-history | Historique glycemie estimee |
| /api/health/correlations | Correlations Pearson entre metriques sante + insights AI |
| /api/health/correlations/trends | Evolution hebdomadaire des correlations (sparklines) |
| /api/health/aging-rate | Algorithme V2 age bio + rythme vieillissement |
| /api/health/body-age | Age biologique (Nora AI ou fallback) |
| /api/health/summary | Resume sante quotidien AI |
| /api/health/daily-report | Rapport complet avec subscores |
| /api/health/sleep | Donnees sommeil bracelet |
| /api/health/thresholds | CRUD seuils personnalises |
| /api/alerts/live-active | Statuts live actifs avec locations + ETA |
| /ws/admin-alerts | WebSocket admin temps reel |

## Backlog
Voir ROADMAP.md
