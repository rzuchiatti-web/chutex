# CHUTEX HEALTH - PRD

## iOS App TestFlight
- https://appstoreconnect.apple.com/apps/6759215592/testflight/ios
- v1.0.2 build 101 (TextInput natifs + Push)

## BLE Bluetooth Scale (Feb 15, 2026)
### Frontend (`src/services/ble.ts`)
- `scanForScales()` - Scan BLE for Lefu scales
- `connectToScale()` - Connect + monitor weight notifications
- `disconnectScale()` - Clean disconnect
- `parseScaleData()` - Parse Lefu BLE packets (CF-series, generic)
- Supports: weight, impedance, stability detection

### Backend
- `POST /api/devices/scale/link` - Link scale MAC to user
- `POST /api/devices/scale/ble-measurement` - Store BLE measurement with BIA calc
- Local BIA formulas as fallback when Lefu API unavailable
- Calculates: BMI, body fat%, muscle mass, bone mass, hydration, visceral fat, BMR, body age, protein, health score

## Lefu API Integration
- `services/lefu_service.py` - Token + body data calculation
- AppKey needs authorization for body data endpoint (error 4016)
- 30+ body metrics supported

## Push Notifications - 9 categories with preferences UI
## UX Help Layer - PageExplainers on: Alertes, Santé, Appareils, Teleconsult

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P1: Deploy on HDS server
- P1: Contact Lefu for API auth
- P2: Shopify, WebSocket
