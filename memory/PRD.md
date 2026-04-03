# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000 / iOS WebView
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)

## Build 87 - Corrections Majeures

### BLE V8 Natif iOS (complet)
- [x] BleManager persistent (plus de "unknown state")
- [x] onStateChange attend PoweredOn avant scan
- [x] Noms V8: V8, JCV8, HB8, 2301 + anciens 2208, J22, JStyle, Elio
- [x] Apres connexion: startBraceletProtocol() complet
- [x] Notifications FFF7 avec parsing natif (0x0D, 0x09, 0x28, 0x50)
- [x] Commandes initiales: time sync, battery, steps, HR, SpO2, HRV+BP, glucose
- [x] Polling 10s (realtime) + 30s (full mesures + check vibration)
- [x] Push backend via WebView inject (token auth)
- [x] Associate + sync apres connexion
- [x] Vibration (0x08) pour rappels et reveil
- [x] Support balance scan natif iOS

### Loaders
- [x] WebView renderLoading supprime (plus de loader natif)
- [x] Tabs _layout garde FullScreenLoader DNA uniquement pour auth
- [x] Pages tab (health, chat, alerts) utilisent des inline loaders legers

### iOS Layout
- [x] Header 70px padding-top sur toutes les pages
- [x] Popups 70px padding-top
- [x] Plein ecran (pas de SafeAreaView)
- [x] overscroll-behavior: none
- [x] scrollEnabled=false + bounces=false

### Bug Fixes
- [x] Minceur 500 (types string → float dans mifflin_st_jeor + calc_bmi)
- [x] Abonnement: uniquement Standard Elio
- [x] Pro subscriptions/rappels/coach supprimes
- [x] Donnees simulees supprimees partout

## Backlog
- P1 : Tester BLE V8 sur TestFlight avec bracelet physique
- P2 : Gilet, Parrainage, Essai 7j, Vivoo
