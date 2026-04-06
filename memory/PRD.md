# Chutex Care - PRD

## Build 123 (2026-04-06) — Pipeline BLE → WebSocket → UI temps réel

### Architecture BLE sync (Build 123):
```
Bracelet BLE → Frontend parse → POST /api/bracelet/v8/push
  → Backend: stocke device doc + readings + consolidated
  → Backend: invalide cache daily-report
  → Backend: envoie WebSocket {type: "ble_sync"} au frontend
  → Frontend: NotificationCenter reçoit → clearApiCache() + fetchData()
  → Toutes les pages se rafraîchissent instantanément
```

### Corrections Build 123:
- Pipeline WebSocket ble_sync pour refresh UI instantané après push BLE
- Parser Chrome BLE aligné avec parser natif (HR bytes[21])
- useAutoReconnect réécrit avec monitoring + polling complet
- Bouton Sync skip pairing steps pour bracelet déjà associé
- Batterie toujours visible sur carte Elio
- Bibliothèque exercices accessible au bénéficiaire (40 templates)
- Sommeil cohérent (581min = 9h41, apnée 45%, régularité restaurée)
- Padding 70px sur tous les popups

### Native iOS auto-reconnect:
- _layout.tsx: 3s après chargement WebView + retry 30s
- scanAndConnect silent avec knownDeviceId
- startBraceletProtocol: monitoring FFF7 + polling 10-15s
- sendInitialCommands: battery, sleep(10 segments), HR, SpO2, HRV+BP, steps, glucose, temperature, historiques

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py. Routes: bracelet_routes.py, health_report_routes.py
- DB: MongoDB (vitallink_db)

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P2: Deploiement TCP J2358, Gilet, Signature, Parrainage, Essai 7j, Vivoo
