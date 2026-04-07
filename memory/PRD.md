# Chutex Care - PRD

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE: bleV8Bridge.ts (natif) + useBleConnection.ts (Chrome)
- Backend: FastAPI. WebSocket: ws_manager.py
- DB: MongoDB (vitallink_db)

## Corrections en cours (session actuelle)

### Corrigé :
- BLE listener fix (plus de suppression du handler)
- Gilet BLE : filtres ajoutés (Sx-, sairbag)
- Description Elio premium (sans détection chute)
- Bouton Synchroniser supprimé de carte Elio (affiché seulement si non associé)
- DeviceDetailPopup refonte : ID aligné gauche, données bracelet (FC/SpO2/Temp/Pas/Cal), delete en bas
- Bug exercice : frontend lisait `completed_today` mais backend envoie `done_today` → corrigé
- Bug pas 354 : readings corrompues (timestamp 9734) supprimées → maintenant 1329 pas corrects
- Accents français sur health-detail et devices
- Pairing bracelet : 2 étapes seulement (pas de "dissocier"), textes Elio
- Headers centrés (activité, sommeil, minceur, metric-detail)

### Reste à faire :
- Page santé refonte (cartes grises, glycémie)
- Popups explicatives 70px + bouton rond
- Page exercice centrer titre + pilules
