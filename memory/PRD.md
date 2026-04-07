# Chutex Care - PRD

## Build 136 (2026-04-07) — Correctifs retours utilisateur

### Corrections Build 136:
- **BLE Connection fix**: Corrigé le bug de listener ble_result qui cassait la connexion bracelet/gilet sur iOS
- **Pairing bracelet**: Supprimé étape "dissocier app fabricant", corrigé textes (pas de bouton latéral, Elio pas V6)
- **Headers centrés**: Titre centré sur pages Activité, Sommeil, Minceur, Metric-detail (aligné avec bouton retour)
- **ECG**: Nora avant "Comprendre les données"
- **Dashboard refresh**: Re-fetch auto quand la page redevient visible (exercice validé → pilule mise à jour)
- **Pairing MAC step**: "Elio à proximité" au lieu de "V6"

### Accents à corriger (passage global restant)
Les textes utilisent des translittérations ASCII (e au lieu de é). Passage progressif vers UTF-8 correct.

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py
- DB: MongoDB (vitallink_db)

## Pipeline BLE
```
Bracelet → POST /api/bracelet/v8/push → Backend → WebSocket ble_sync → Frontend refresh
```

## Issues restantes signalées par l'utilisateur
- Sommeil: anciennes nuits non affichées au changement de jour calendrier
- Sommeil: durée 9h42 possiblement incorrecte (couché ~minuit, levé ~7h30)
- Hypnogramme: heures/cycles toujours incorrects
- Accents français manquants dans toute l'app
- Nora: pas d'accès aux données dans le chat

## Upcoming
- P2: TCP J2358, Gilet complet, Signature, Parrainage, Essai 7j, Vivoo
