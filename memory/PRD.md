# CHUTEX (Elio) - PRD

## Objectif
Application santé connectée iOS (Expo WebView + FastAPI + MongoDB) pour le suivi de patients/bénéficiaires via bracelet V8, balance Lefu, et IA (GPT-5.2).

## Architecture
- **Frontend** : React Native Expo shell avec WebView (95% de l'app en web). Bridge BLE natif dans `_layout.tsx` → `bleV8Bridge.ts`
- **Backend** : FastAPI. Routes modulaires. Background tasks (cache IA, vibrations, rappels).
- **BLE** : Protocole J-Style 2208A. Service FFF0, Write FFF6, Notify FFF7. Packets 16 octets + CRC.

## Protocole BLE V8 (corrigé le 2026-04-03)
| Commande | Hex | Description |
|----------|-----|------------|
| Time Sync | 0x01 | Synchronisation horloge |
| Steps | 0x09 | Comptage pas temps réel |
| Battery | 0x13 | Niveau batterie (0-100) |
| Vitals | 0x28 | Mesure santé (HR/SpO2/HRV/Stress/BP/Temp) |
| Vibrate | 0x36 | Vibration moteur (1-5 vibrations) |
| Glucose | 0x50 | Glycémie estimée PPG |
| Step Detail | 0x52 | Historique pas détaillé |
| Sleep | 0x53 | Données sommeil détaillées |
| HR History | 0x54 | Historique fréquence cardiaque |
| HR Single | 0x55 | FC unique |
| HRV Data | 0x56 | Données HRV |
| SpO2 Auto | 0x66 | SpO2 automatique |

## Fonctionnalités implémentées
- [x] Authentification (JWT, multi-rôle: admin, pro, bénéficiaire)
- [x] Dashboard santé avec métriques temps réel
- [x] Bridge BLE natif iOS (bleV8Bridge.ts)
- [x] Parsing de TOUTES les trames V8 (0x09, 0x13, 0x28, 0x50, 0x52, 0x53, 0x54, 0x55, 0x56, 0x66)
- [x] Vibrations bracelet via 0x36 (rappels, alarmes, coucher)
- [x] Cache intelligent Daily Report IA (pré-calcul 4h, invalidation sur push)
- [x] Page Santé (Daily Report IA GPT-5.2)
- [x] Gestion des rappels (médicaments, hydratation, etc.)
- [x] Alarme réveil matinal
- [x] Rappel coucher
- [x] Programme minceur
- [x] Téléassistance / Pro
- [x] Notifications push
- [x] Audit pré-production (12 sections, 13 corrections, 4 refactorisations)
- [x] Suite de tests backend (28+21 tests)

## Règles
- ZÉRO donnée simulée (mock). Si donnée manquante → "--"
- Température en big-endian dans les trames BLE
- Cache Metro Bundler : toujours restart expo après modification frontend

## Backlog
- [ ] P1: Validation physique BLE V8 (test avec bracelet réel)
- [ ] P2: Configuration WiFi balance Lefu
- [ ] P2: Serveur TCP J2358 production
- [ ] P2: Gilet connecté
- [ ] P2: Signature Électronique Admin
- [ ] P2: Système de parrainage Gardiens
- [ ] P2: Flux essai gratuit 7j
- [ ] P2: Test urinaire Vivoo
