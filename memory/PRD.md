# Chutex Care — PRD (Product Requirements Document)

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes.

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) + MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud, GPT-5.2

## Fonctionnalites implementees

### Dashboard Beneficiaire - Mode Light/Dark (Mars 2026)
- Toggle theme light/dark dans le header (icone soleil/lune)
- Persistance du choix via localStorage (`chutex_dark`)
- Mode Dark: fond #0a0a0f + glow violet, cartes glass sombres, texte blanc
- Mode Light: fond #F0EDE8 beige/creme, cartes blanches translucides, texte sombre
- GlassTabBar s'adapte automatiquement au theme
- Carte CopilotCard (Nora) supprimee du dashboard
- NoraPill supprime des objectifs journaliers
- Toutes les couleurs (cartes, bordures, texte, separateurs) adaptees au theme
- 4 cartes objectifs: Apport calorique, Hydratation, Activite physique, Endormissement
- Rappels, gardiens, alertes adaptees au mode choisi

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

### Teleassistance
- SOS, alertes automatiques, GPS, interventions
- Alertes actives et historique
- Gardiens avec notifications SMS/push

## Backlog (a venir)

### P0
- Finaliser integration Balance & Vest (verification flux donnees combine)

### P1
- Systeme de signature electronique (onglet Documents admin)

### P2
- Systeme de parrainage Guardian
- Essai gratuit 7 jours
- Visualisation PDF des contrats
- Integration test urinaire Vivoo
- Refactoring: program_routes.py (1866 lignes), teleassistance_routes.py (1131 lignes)

## Fichiers cles
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx` — Dashboard beneficiaire principal
- `/app/frontend/src/components/dashboard/DailyObjectives.tsx` — Cartes objectifs journaliers
- `/app/frontend/src/components/dashboard/constants.ts` — Constantes design et images
- `/app/frontend/src/components/GlassTabBar.tsx` — Barre de navigation adaptive
- `/app/frontend/src/components/dashboard/AlertBanner.tsx` — Banniere alertes
- `/app/frontend/src/components/dashboard/SharedUI.tsx` — Composants UI partages

## Credentials de test
| Role | Email / Phone | Password |
| :--- | :--- | :--- |
| **Admin** | `0600000001` | `admin123` |
| **Beneficiaire (Josette)** | `0651245918` | `test123` |
| **Gardien (Marie)** | `+33699887766` | `test123` |
