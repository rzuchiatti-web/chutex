# CHUTEX (Elio) - PRD

## Objectif
Application sante connectee iOS (Expo WebView + FastAPI + MongoDB) pour le suivi de patients/beneficiaires via bracelet V8, balance Lefu, et IA (GPT-5.2).

## Architecture
- **Frontend** : React Native Expo shell avec WebView (95% de l'app en web). Bridge BLE natif dans `_layout.tsx` -> `bleV8Bridge.ts`
- **Backend** : FastAPI. Routes modulaires. Background tasks (cache IA, vibrations, rappels).
- **BLE** : Protocole J-Style 2208A. Service FFF0, Write FFF6, Notify FFF7. Packets 16 octets + CRC.

## Protocole BLE V8 (verifie et corrige le 2026-04-03)
| Commande | Hex | Description |
|----------|-----|------------|
| Time Sync | 0x01 | Synchronisation horloge |
| Steps | 0x09 | Comptage pas temps reel |
| Battery | 0x13 | Niveau batterie (0-100) |
| Vitals | 0x28 | Mesure sante (HR/SpO2/HRV/Stress/BP/Temp) |
| Vibrate | 0x36 | Vibration moteur (1-5 vibrations) |
| Glucose | 0x50 | Glycemie estimee PPG |
| Step Detail | 0x52 | Historique pas detaille |
| Sleep | 0x53 | Donnees sommeil detaillees (multi-segment, 8 octets metadata) |
| HR History | 0x54 | Historique frequence cardiaque |
| HR Single | 0x55 | FC unique |
| HRV Data | 0x56 | Donnees HRV |
| SpO2 Auto | 0x66 | SpO2 automatique |

## Validation physiologique (ajoutee 2026-04-03)
| Metrique | Min | Max | Action si hors range |
|----------|-----|-----|---------------------|
| Heart Rate | 30 | 220 | Filtre (pas stocke) |
| SpO2 | 50 | 100 | Filtre |
| HRV | 1 | 200 | Filtre |
| Stress | 1 | 100 | Filtre |
| Systolic BP | 60 | 250 | Filtre |
| Diastolic BP | 30 | 150 | Filtre |
| Temperature | 34.0 | 42.0 | Filtre |

## Sommeil V8 (corrige 2026-04-03)
- Chaque segment a 8 octets de metadonnees: [seg_id, year, month, day, hour, minute, type, count]
- Stages valides: 1=Deep, 2=Light, 3=REM, 4=Awake
- Agregation par segment_id dans devices.sleep_segments
- Total sommeil = SUM de tous les segments uniques (pas le max)

## Fonctionnalites implementees
- [x] Authentification (JWT, multi-role: admin, pro, beneficiaire)
- [x] Dashboard sante avec metriques temps reel
- [x] Bridge BLE natif iOS (bleV8Bridge.ts)
- [x] Parsing de TOUTES les trames V8 (0x09, 0x13, 0x28, 0x50, 0x52, 0x53, 0x54, 0x55, 0x56, 0x66)
- [x] Vibrations bracelet via 0x36 (rappels, alarmes, coucher)
- [x] Cache intelligent Daily Report IA (pre-calcul 4h, invalidation sur push)
- [x] Validation physiologique des vitaux (filtre donnees impossibles)
- [x] Agregation multi-segment du sommeil
- [x] Nettoyage fausses alertes anomaly (1262 alertes + 2077 lectures invalides supprimees)
- [x] Page Sante: FullScreenLoader DNA uniquement (plus de 3 loaders)
- [x] Health Report: lecture des donnees agregees device

## Regles
- ZERO donnee simulee (mock). Si donnee manquante -> "--"
- Temperature en LITTLE-ENDIAN (confirme par test physique V8)
- Cache Metro Bundler : toujours restart expo apres modification frontend

## Backlog
- [ ] P1: Validation physique BLE V8 (test avec bracelet reel - Build 99 TestFlight)
- [ ] P2: Configuration WiFi balance Lefu
- [ ] P2: Serveur TCP J2358 production
- [ ] P2: Gilet connecte
- [ ] P2: Signature Electronique Admin
- [ ] P2: Systeme de parrainage Gardiens
- [ ] P2: Flux essai gratuit 7j
- [ ] P2: Test urinaire Vivoo
