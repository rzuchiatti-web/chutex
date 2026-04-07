# Chutex Care - PRD

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py. Routes: bracelet_routes.py, health_report_routes.py
- DB: MongoDB (vitallink_db)

## BLE Sync Pipeline
```
Bracelet BLE → POST /api/bracelet/v8/push → Backend Save → WebSocket ble_sync → Frontend clearApiCache() + fetchData()
→ Also dispatches ble_vitals CustomEvent for live pulse on metric-detail
```

## Completed (2026-04-07)

### Jeux Dorsi - Visual Enhancement (5 jeux)
- **Moutons**: Gradient radial bg (#0f1923→#060a0f), curseur avec glow cyan (shadowBlur=20), anneau extérieur
- **Bulles**: Deep space gradient (#130f25→#060410), curseur glow violet
- **Proprioception**: Gradient radial vert (#0a1a15→#060a0f), balle glow + anneau pulse animé (sin wave)
- **Serpent**: Bg sombre + grille néon orange, nourriture glow, segments ronds avec trail lumineux
- **Labyrinthe**: Bg sombre + grille rose, murs néon glow, objectif pulse animé

### Pouls Temps Réel via WebSocket
- NotificationCenter dispatch `ble_vitals` CustomEvent quand ble_sync arrive avec heart_rate
- metric-detail écoute `ble_vitals` pour mise à jour instantanée (en plus du polling 10s)
- Badge "bpm en direct" avec point pulsant dans le header

### P1 Fixes (session précédente)
- Poids/IMC: fallback profil, progress bar corrigée
- Exercice: clearApiCache après complétion
- Rappels: WebSocket reminder_alert temps réel
- Gilet BLE: timeout 25s scan
- Dorsi: coussin obligatoire, historique bilans

## Upcoming Tasks
- P2: Deploiement TCP J2358, Gilet complet, Signature, Parrainage, Essai 7j, Vivoo
