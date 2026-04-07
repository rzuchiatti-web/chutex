# Chutex Care - PRD

## Build 129 (2026-04-06) — Pipeline BLE → WebSocket → UI temps réel

### Architecture BLE sync (Build 129):
```
Bracelet BLE → Frontend parse → POST /api/bracelet/v8/push
  → Backend: stocke device doc + readings + consolidated
  → Backend: invalide cache daily-report
  → Backend: envoie WebSocket {type: "ble_sync"} au frontend
  → Frontend: NotificationCenter reçoit → clearApiCache() + fetchData()
  → Toutes les pages se rafraîchissent instantanément
```

### Corrections Build 129:
- Pipeline WebSocket ble_sync pour refresh UI instantané après push BLE
- Parser Chrome BLE aligné avec parser natif (HR bytes[21])
- useAutoReconnect réécrit avec monitoring + polling complet
- Bouton Sync skip pairing steps pour bracelet déjà associé
- Batterie toujours visible sur carte Elio
- Bibliothèque exercices accessible au bénéficiaire (40 templates)
- Sommeil cohérent (581min = 9h41, apnée 45%, régularité restaurée)
- Padding 70px sur tous les popups
- Fix crash fetchData TDZ (Temporal Dead Zone)

### Batch UI/UX (2026-04-07):
- Bouton "Voir mon activité" : blanc avec icône en dark mode
- Page Devices : dark mode complet (cartes glass, textes blancs, contraste)
- Page Devices : espacement header augmenté (padding 44px)
- Dorsi Bilan : suppression bouton "Continuer sans coussin" (connexion obligatoire)
- Dorsi Bilan : suppression images de direction (phases 3-6)
- Dorsi Bilan : pourcentage centré dans le cercle de mesure
- Dorsi Bilan + Programme : boutons retour ronds (borderRadius 999)
- Dorsi Programme : popup info glass effect renforcé (blur 32px)
- Instructions bracelet : charge >20% (vert clignotant), positionnement 1 doigt du poignet
- DeviceCard : dark mode support complet

### Native iOS auto-reconnect:
- _layout.tsx: 3s après chargement WebView + retry 30s
- scanAndConnect silent avec knownDeviceId
- startBraceletProtocol: monitoring FFF7 + polling 10-15s
- sendInitialCommands: battery, sleep(10 segments), HR, SpO2, HRV+BP, steps, glucose, temperature, historiques

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py. Routes: bracelet_routes.py, health_report_routes.py
- DB: MongoDB (vitallink_db)

## Pending Issues
- P1: Cohérence données Poids & IMC (barre progression, page IMC vide)
- P1: Validation exercice non reflétée (rafraîchir dashboard + pilule)
- P1: Rappels/Alarmes/Notifications Push (confirmation in-app, vibration 20s retard, push absentes)
- P1: Gilet BLE (Vest) scan en boucle infinie
- P2: Pouls en temps réel (Header)

## Upcoming Tasks
- P1: Jeux Dorsi (imposer coussin connecté, complexité 5 jeux, historique bilans)
- P1: Minceur/Poids (enlever refresh/streak, placer streak sous poids)
- P1: Configuration WiFi balance Lefu
- P2: Deploiement TCP J2358, Gilet complet, Signature, Parrainage, Essai 7j, Vivoo
