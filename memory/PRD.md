# Chutex Care - PRD

## Build 114+ (2026-04-05) — Bug Fixes Post-TestFlight

### Corrections Build 114+ (Session actuelle) :

**Backend:**
- Temperature: fallback depuis device_readings si absente du device document (36.8C recuperee)
- Distance: calculee a partir des pas (stride = height_cm * 0.00415)
- VO2 Max: formule plus conservative (base 15.0, HRV correction cappee a +/-3, age deduction)
- Resultat: 45.7 au lieu de 48.9 (user WHOOP = 40)
- Analysis Phase: comptage distinct days via aggregation MongoDB + jours calendaires depuis 1er reading
- Resultat: Jour 3/7 au lieu de 1/7 (bloque)
- Sommeil: validation BCD dates (year >= 2024), fallback sur server timestamp si BCD incorrect
- Resultat: dates 2026-04-05 au lieu de 2017-10-06
- Glycemie: calibrations test (bracelet_v8 PPG) supprimees, cache report nettoye
- Sleep stages transmis dans daily-report (pour hypnogramme)

**Frontend:**
- AnalysisPhase: textes header en opacite 0.75+ (etait 0.4), bouton blanc pur
- AnalysisPhase popup: close button avec padding-top 70px (etait 16px)
- ECG detail: padding top 70px (etait 20px)
- ECG detail: bouton retour -> /(tabs)/health au lieu de router.back()
- ECG detail: carte Nora interactive (NoraButton + NoraOverlay) au lieu du simple NoraCard
- ECG detail: carte educative "Qu'est-ce qu'un ECG" avec ondes P, QRS, T
- GlycemiaCard + glycemia-detail: affichage toFixed(2) (1.00 au lieu de 1)
- Activity detail: calendrier charge les donnees du jour selectionne (metric-history pour dates passees)
- Activity detail: Recovery et VO2 Max redesignes (GaugeRing, description, echelle visuelle)

### Build 114 (2026-04-05) — Refonte complete bracelet V8

**Parsing BLE recalibre :**
- 0x09 (steps) : HR=v[21], temp=v[22-23], active_min=v[13-16]
- 0x14 (temperature) : temp = (v[1]+v[2]*256)/10
- 0x28 sub1 : HR=v[2], SpO2=v[3], HRV=v[4], Stress=v[5], SYS=v[6], DIA=v[7]
- 0x53 (sommeil) : segment_index=v[1], sleepLength=v[9], stages=v[10+], BCD dates
- 0x54 (HR history) : 15 HR readings a partir de v[9]
- 0x56 (HRV history) : HRV=v[9], VascAge=v[10], HR=v[11], Stress=v[12], SYS=v[13], DIA=v[14]
- 0x66 (SpO2 history) : SpO2=v[9]
- 0x07 (ECG) : waveform 24-bit + result (AV block, HR, HRV, BP, stress, mood, breath)
- 0x78 (glycemie) : cmd corrige (etait 0x50)
- Time sync : BCD format

**Sommeil :** Multi-segments agreges par nuit, vrais stages min-by-min, dates BCD du bracelet
**ECG :** Bridge natif + cmd PPG enable + analyse resultat bracelet (plus de hardcode)
**VO2 Max :** Baseline HRV par age, formule conservative
**Recovery :** Calcul (HRV+sommeil+stress+deep)
**Glycemie ML :** Algo Gradient Boosting fonctionnel
**Reveil :** Selecteur jours de la semaine ajoute
**Padding 70px :** Tous les boutons retour/fermer corriges

## Architecture
- Frontend: Hybride (React Native _layout.tsx + WebView). BLE bridge natif: bleV8Bridge.ts
- Backend: FastAPI. Routes sante: health_report_routes.py, health_sleep_routes.py
- DB: MongoDB (vitallink_db). Collections: device_readings, devices, users, ecg_records, glycemia_calibrations

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte
- P2: Signature Electronique
- P2: Systeme parrainage Gardiens
- P2: Flux essai gratuit 7 jours
- P2: Integration test urinaire Vivoo
