# Chutex Care - PRD

## Architecture
- Frontend: React Native (Expo) + WebView iOS. BLE natif dans `_layout.tsx` + `bleV8Bridge.ts`
- Backend: FastAPI + MongoDB (`vitallink_db`)
- BLE: JStyle 2208A/V8, service `0000FFF0`, write `FFF6`, notify `FFF7`

## Corrections Build 109 (2026-04-03)
1. **Bande blanche supprimée** : Retrait du MutationObserver qui causait le double padding (140px)
2. **Sommeil corrigé** : Le rapport utilise maintenant les données agrégées du device (82 min) au lieu de la dernière lecture seule (12 min)
3. **ECG via bridge natif** : La page ECG utilise `ReactNativeWebView.postMessage({action:'ble_ecg_start'})` au lieu de Web Bluetooth (non dispo en WKWebView)
4. **Auto-reconnexion agressive** : Scan BLE direct au démarrage (plus de dépendance API), retry toutes les 30s
5. **Bug Nora corrigé** : TypeError height str→float dans `nora_routes.py`
6. **SpO2 sanitisé** : Validation 60-100 partout
7. **Padding 70px** : Appliqué manuellement sur 15+ pages/overlays (sans MutationObserver)

## Corrections Build 105 (précédent)
- SpO2 validation, has_device, timeout 300s, parser BLE sub-type, loader DNA

## Tâches à venir
- P1: Config WiFi balance Lefu
- P2: Serveur TCP J2358 production
- P2: Gilet connecté, Signature électronique, Parrainage, Essai 7j, Vivoo
