# Chutex Care - PRD

## Build 114+ v2 (2026-04-05) — Corrections completes Post-TestFlight

### Session actuelle — Corrections additionnelles :

**VO2 Max recalibree (WHOOP match):**
- Base multiplier 13.5 (etait 15.0) — calibre contre WHOOP
- HRV correction conservative: 0.03 per ms, cap +/-2
- Gender correction: +1.5 (etait +2.0)
- Resultat: 40.4 ml/kg/min (WHOOP user = 40)

**Temperature — logique stricte:**
- N'affiche QUE les mesures recentes (<24h)
- Verifie existence d'un reading temperature du jour
- Si pas de mesure aujourd'hui: affiche "--" (temperature=0)

**Metric-history — refonte performance:**
- Migration vers MongoDB aggregation pipeline (etait .to_list(500))
- Filtre cible: data.{key} avec ranges physiologiques (HR 30-200, SpO2 60-100, temp 30-45)
- Gere 8000+ readings efficacement
- Resultat: 2 points jour/jour au lieu de 0

**Sleep debt/regularity — UX:**
- Graph 7 jours affiche seulement si >= 2 nuits de donnees
- Message explicatif si donnees insuffisantes

### Corrections Build 114+ precedentes :
- Distance: calculee a partir des pas (stride = height_cm * 0.00415)
- Analysis Phase: aggregation MongoDB + jours calendaires (3/7 au lieu de 1/7)
- Sommeil BCD dates: validation year >= 2024, fallback server timestamp
- Glycemie: calibrations test supprimees, affichage toFixed(2) = 1.00 g/L
- Header sante: textes blanc pur (opacite 0.75+)
- ECG detail: 70px padding, retour → page Sante, carte Nora + carte educative ECG
- Activity: calendrier charge donnees du jour selectionne, Recovery/VO2 redesignes

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE bridge: bleV8Bridge.ts
- Backend: FastAPI. Routes: health_report_routes.py, health_sleep_routes.py
- DB: MongoDB (vitallink_db)

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte, Signature Electronique
- P2: Parrainage Gardiens, Essai gratuit 7j, Test urinaire Vivoo
