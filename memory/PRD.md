# Chutex Care - PRD

## Build 120+ (2026-04-06) — Fix critique parser BLE Chrome

### Session 3 (2026-04-06) - Fix BLE Chrome:

**Parser BLE Chrome desaligne avec V8 SDK:**
- `useBleConnection.ts` parseBraceletResponse lisait heart_rate a bytes[13] au lieu de bytes[21]
- Format V8: [cmd, steps(4), cal(4), dist(4), activeMin(4), exerciseMin(4), HR, tempLo, tempHi]
- Corrige: alignement complet avec bleV8Bridge.ts (parser natif)
- Ajout check length >= 22 pour cmd 0x09

**Bouton Synchroniser:**
- Ne lance plus le pairing BLE
- Rafraichit les donnees serveur (clearApiCache + daily-report force + fetchDevices)
- Animation de rotation pendant la sync

**Batterie toujours visible:**
- Carte Elio affiche la batterie meme si valeur = 0 (affiche "--")
- Barre de progression uniquement si > 0%

**Bibliotheque exercices pour beneficiaire:**
- Endpoint retourne TOUS les 40 templates (force, cardio, mobilite, souplesse)
- L'utilisateur peut s'auto-prescrire des exercices

### Sessions precedentes:
- Fix sommeil (coherence 10h vs 9h42, hypnogramme, apnee 92%->45%)
- Carte regularite restauree
- Padding 70px popups

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE bridge: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome Web BLE)
- Backend: FastAPI. Routes: health_report_routes.py, bracelet_routes.py
- DB: MongoDB (vitallink_db)

## Important: Expo Go ne fonctionne PAS
L'app utilise des modules BLE natifs (react-native-ble-plx). TestFlight obligatoire pour iOS.

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte, Signature, Parrainage, Essai 7j, Vivoo
