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

### P1 Fixes (2026-04-07):
**Poids & IMC:**
- Backend daily-report: fallback au profil user (weight_kg/height_cm) pour poids et IMC quand aucune pesée balance
- Dashboard: corrigé minceurData.current?.weight (au lieu de .current_weight)
- Barre progression objectif poids: formule corrigée (plus bloquée à 50%)
- BMI affiché 24.5 dans santé métabolique

**Validation exercice:**
- clearApiCache() appelé après complétion d'un exercice (rafraîchit dashboard automatiquement)

**Rappels & Notifications Push:**
- Backend envoie WebSocket 'reminder_alert' en temps réel quand un rappel se déclenche
- Frontend NotificationCenter reçoit 'reminder_alert' et affiche un banner in-app immédiat
- Push notification + notification in-app créée pour chaque rappel
- Vibration bracelet déclenchée (2-4 vibrations selon type)

**Gilet BLE (Vest):**
- Ajout timeout 25s pour le scan BLE natif du gilet (évite la boucle infinie)
- Status passé à 'error' avec message explicatif si pas de réponse

### Batch UI/UX (2026-04-07):
- Bouton "Voir mon activité" : blanc avec icône en dark mode
- Page Devices : dark mode complet (cartes glass, textes blancs, contraste)
- Dorsi Bilan : suppression "Continuer sans coussin", suppression images phases, % centré
- Dorsi Programme : bouton retour rond, popup info glass renforcé
- Instructions bracelet : charge >20% (vert clignotant), positionnement 1 doigt du poignet

### Native iOS auto-reconnect:
- _layout.tsx: 3s après chargement WebView + retry 30s
- scanAndConnect silent avec knownDeviceId
- startBraceletProtocol: monitoring FFF7 + polling 10-15s

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py. Routes: bracelet_routes.py, health_report_routes.py
- DB: MongoDB (vitallink_db)

## Upcoming Tasks
- P1: Jeux Dorsi (imposer coussin connecté, complexité 5 jeux, historique bilans)
- P1: Minceur/Poids (enlever refresh/streak, placer streak sous poids)
- P1: Configuration WiFi balance Lefu
- P2: Pouls en temps réel dans header page pouls
- P2: Deploiement TCP J2358, Gilet complet, Signature, Parrainage, Essai 7j, Vivoo
