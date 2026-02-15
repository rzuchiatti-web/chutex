# CHUTEX HEALTH - PRD (Updated Feb 15, 2026)

## iOS App TestFlight
- App Store Connect: https://appstoreconnect.apple.com/apps/6759215592/testflight/ios
- Latest: v1.0.5 (fix BLE parsing QN-Scale protocol + Lefu SDK plugin)

## BLE Scale Integration - CF597_GNLine
### Protocol: QN-Scale (open-source, reverse-engineered)
- Weight: bytes 15-16 big-endian, / 100 = kg
- Impedance: bytes 17-18 (if present)
- Stability flag: byte 0 bit 5
- Fallback: scan all byte pairs for valid weight range (20-250 kg)

### Lefu SDK (Native iOS) - In Progress
- Plugin Expo: `/app/frontend/plugins/lefu-scale/index.js`
- CocoaPods: PPBaseKit 1.2.17, PPBluetoothKit 1.2.33, PPCalculateKit 1.2.24
- BLOCKED: needs lefu.config file from Lefu Open Platform
- Contact: pengsiyuan@lefu.cc

### Backend Endpoints
- POST /api/devices/scale/link - Link scale MAC to user
- POST /api/devices/scale/ble-measurement - Store BLE measurement + BIA calc
- POST /api/lefu/wifi/weighing - WiFi scale data (30+ fields)
- GET /api/devices/scale/history - Measurement history

## Push Notifications - 9 categories + preferences UI
## UX Help Layer - PageExplainers on 4 screens

## Backlog
- P1: Lefu SDK native integration (needs lefu.config)
- P1: Deploy backend on HDS server
- P2: Design clinique page balance
- P3: Shopify, WebSocket
