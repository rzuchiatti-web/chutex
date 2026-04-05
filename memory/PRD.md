# Chutex Care - PRD

## Build 114+ v2 (2026-04-05) — Corrections completes Post-TestFlight

### Corrections cette session :

**VO2 Max (calibree WHOOP):**
- Base multiplier 13.5 (calibre contre WHOOP du user = 40)
- HRV correction: 0.03/ms, cap +/-2. Gender: +1.5
- Resultat: 40.4 ml/kg/min

**Temperature — logique stricte:**
- N'affiche QUE mesures recentes (<24h) + verifie existence reading du jour
- Si pas de mesure aujourd'hui: "--"
- La commande 0x14 est envoyee au bracelet pendant la synchro (capteur 3-NTC)

**Metric-history — refonte MongoDB aggregation:**
- Pipeline aggregation au lieu de .to_list(500) — gere 8000+ readings
- Filtre physiologique au niveau DB: HR 30-200, SpO2 60-100, temp 30-45, BP 60-250
- Resultat: historique jour/jour fonctionne (2 points au lieu de 0)

**Distance:** Calculee depuis pas (stride = height_cm * 0.00415)
**Analysis Phase:** Aggregation MongoDB + jours calendaires (3/7)
**Sommeil dates:** Validation BCD year >= 2024, fallback server timestamp
**Glycemie:** Calibrations test supprimees, affichage toFixed(2) = 1.00 g/L

**UI Frontend:**
- Header sante: textes blanc pur (opacite 0.75+)
- ECG detail: 70px padding, retour → page Sante, carte Nora interactive + educative
- Popup analyse: 70px close button
- Glycemie: 1.00 g/L au lieu de "1"
- Activite: calendrier charge donnees du jour, Recovery/VO2 redesignes
- Sleep debt: message explicatif si < 2 nuits

**Gilet (vest-connect):**
- Connexion BLE migrée vers bridge natif iOS (postMessage ble_scan_vest)
- Monitoring UART service après connexion (FFE0/NUS)
- Web Bluetooth fallback conserve pour Chrome desktop

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE bridge: bleV8Bridge.ts
- Backend: FastAPI. Routes: health_report_routes.py, health_sleep_routes.py
- DB: MongoDB (vitallink_db)

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte (data monitoring complet)
- P2: Signature Electronique, Parrainage, Essai 7j, Vivoo
