# Chutex Care - PRD

## Build 114 (2026-04-05) — Refonte complète bracelet V8

### Corrections majeures (toutes basées sur SDK V8 officiel) :

**Parsing BLE recalibré :**
- 0x09 (steps) : HR=v[21], temp=v[22-23], active_min=v[13-16]
- 0x14 (température) : temp = (v[1]+v[2]*256)/10
- 0x28 sub1 : HR=v[2], SpO2=v[3], HRV=v[4], Stress=v[5], SYS=v[6], DIA=v[7]
- 0x53 (sommeil) : segment_index=v[1], sleepLength=v[9], stages=v[10+], BCD dates
- 0x54 (HR history) : 15 HR readings à partir de v[9]
- 0x56 (HRV history) : HRV=v[9], VascAge=v[10], HR=v[11], Stress=v[12], SYS=v[13], DIA=v[14]
- 0x66 (SpO2 history) : SpO2=v[9]
- 0x07 (ECG) : waveform 24-bit + result (AV block, HR, HRV, BP, stress, mood, breath)
- 0x78 (glycémie) : cmd corrigé (était 0x50)
- Time sync : BCD format

**Sommeil :** Multi-segments agrégés par nuit, vrais stages min-by-min, dates BCD du bracelet
**ECG :** Bridge natif + cmd PPG enable + analyse résultat bracelet (plus de hardcode)
**VO2 Max :** Baseline HRV par âge, ~42 vs WHOOP 40
**Recovery :** Nouveau calcul (HRV+sommeil+stress+deep) = 79/100
**Glycémie ML :** Algo Gradient Boosting fonctionnel (0.96 g/L)
**Réveil :** Sélecteur jours de la semaine ajouté
**Padding 70px :** Tous les boutons retour/fermer corrigés (15+ fichiers)
