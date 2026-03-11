# Chutex Care - PRD

## Original Problem Statement
Application de santé préventive "Chutex Care" pour le suivi des personnes âgées avec bracelets connectés, gilet anti-chute, balance connectée, et coussin de rééducation lombaire.

## Core Architecture
- **Frontend**: React Native / Expo (Web + iOS + Android)
- **Backend**: FastAPI + MongoDB
- **BLE**: react-native-ble-plx (native) + Web Bluetooth (Chrome)

## What's Been Implemented

### Session Courante (11 Mars 2026)
- **Nettoyage données fictives**: 26 collections vidées (device_readings, devices, predictive_alerts, glycemia, ECG, dorsi bilans, weighings, caches, etc.)
- **Bug "Supprimer" bracelet corrigé**: Le bracelet sans champ `id` → fallback via `remove-by-type`
- **Backend amélioré**: Suppression réelle des devices (DELETE au lieu de `removed: True`)
- **Intégration BLE native bracelet V6**: 
  - Nouveau `scanForBracelet()` + `connectToBracelet()` dans `ble.ts` via react-native-ble-plx
  - Hook `useBleConnection.ts` mis à jour avec chemin natif BLE
  - Détection du bracelet par nom "2358" et patterns V6
  - Souscription aux services GATT: Heart Rate (0x180D), Battery (0x180F), Custom PPG (0xFFE0), Custom ECG (0xFFF0)
  - Instructions de pairing mises à jour (dissocier app fabricant d'abord)
  - Backend: nom "2358" ajouté aux préfixes V6 connus

### Sessions Précédentes
- Algorithme VO2 Max (formule Uth-Sørensen)
- Dashboard redesign (hero dark + body light, jauge SVG)
- Notifications prédictives corrigées
- Bug validation exercices corrigé
- Bilan dorso-lombaire UI/UX amélioré
- Boutons page devices redesignés

## Known Issues
- **P1**: Bug Swipe Picker (objectif poids) - non résolu
- **P2**: Lenteur pages détail - non résolu
- **P2**: Images/icônes étapes préparation repas - non résolu

## Backlog
- P0: ML glycémie V3
- P1: Connexion physique V6 (EN COURS)
- Parrainage Guardian
- Essai gratuit 7 jours
- Contrat PDF
- Vivoo (test urinaire)
- Corrélations santé UI
- Documentation brevet glucose

## Device Info
- **Bracelet V6**: Nom="2358", MAC=2a66eec842ee9261, IMEI=7ffce8f425029c9061344cda7babb7, Firmware=V0.1.9.8
