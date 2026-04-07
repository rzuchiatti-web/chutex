# Chutex Care - PRD

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py. Routes: bracelet_routes.py, health_report_routes.py
- DB: MongoDB (vitallink_db)

## BLE Sync Pipeline
```
Bracelet BLE → POST /api/bracelet/v8/push → Backend Save → WebSocket ble_sync → Frontend clearApiCache() + fetchData()
```

## Completed (2026-04-07)

### P1 Fixes
- **Poids & IMC**: Backend fallback profil user (75kg → BMI 24.5), frontend minceurData.current?.weight fix, barre progression corrigée
- **Validation exercice**: clearApiCache() après complétion
- **Rappels/Notifications**: WebSocket reminder_alert temps réel, banner in-app, push + vibration
- **Gilet BLE**: Timeout 25s scan natif, plus de boucle infinie

### Batch UI/UX
- Bouton "Voir mon activité" blanc avec icône en dark mode
- Page Devices dark mode complet
- Dorsi Bilan: pas de "continuer sans coussin", pas d'images phases, % centré, boutons ronds
- Dorsi Programme: bouton retour rond, popup info glass renforcé
- Instructions bracelet: charge >20%, positionnement 1 doigt du poignet

### P1 Nouvelles features
- **Minceur**: Streak badge sous le poids dans le header
- **Pouls temps réel**: Badge "bpm en direct" avec polling /api/devices toutes les 10s sur page metric-detail heart_rate
- **Dorsi jeux**: Coussin connecté obligatoire (alert si non connecté), historique 11 bilans avec barres d'évolution (Avant/Arrière/Gauche/Droite)
- **WiFi Balance Lefu**: Déjà implémenté (scale-detail.tsx + configureScaleWifi)

## Upcoming Tasks
- P1: Jeux Dorsi - ajouter complexité/profondeur visuelle à 5 jeux
- P2: Pouls en temps réel - améliorer avec WebSocket au lieu de polling
- P2: Deploiement TCP J2358, Gilet complet, Signature, Parrainage, Essai 7j, Vivoo
