# CHUTEX HEALTH / CARE WATCH - PRD

## Product Overview
AI-powered teleassistance platform for elderly care with 6 user roles.

## iOS App - TestFlight
- **App Store Connect**: https://appstoreconnect.apple.com/apps/6759215592/testflight/ios
- **Bundle ID**: com.chutex.app
- **Latest version**: v1.0.2 build 101 (avec TextInput natifs + push notifications)

## Lefu Smart Scale Integration (Feb 15, 2026)
### Backend
- `POST /api/lefu/wifi/register` - Scale WiFi registration
- `POST /api/lefu/wifi/weighing` - Receive weighing data (30+ body metrics)
- `GET /api/devices/scale/history` - User measurement history
- `POST /api/devices/scale/seed-history` - Seed demo data
- Service `services/lefu_service.py` - Lefu Cloud API integration (token + body calc)
- **Lefu AppKey**: lefu317d5a502fbb2b77 (needs API authorization for body data calc)

### 30+ Metrics Stored
weight, bmi, body_fat_pct, muscle_mass, muscle_rate, bone_mass, hydration_pct, visceral_fat, basal_metabolism, body_age, protein_pct, health_score, subcutaneous_fat, lean_body_mass, fat_free_weight, ideal_weight, body_type, obesity_level, skeletal_muscle_rate, fat_mass, standard_weight, weight_control, fat_control, muscle_control, body_shape, heart_rate, impedance

### Pending
- Contact Lefu support to authorize AppKey for body data calculation API
- Configure real scale WiFi to point to server
- BLE Bluetooth integration for direct iPhone connection

## Push Notifications (Feb 15, 2026)
- 9 categories: SOS, health thresholds, fall, battery, hydration, medication, alarms, interventions, guardian requests
- Notification preferences page in Profile with toggles
- Backend: `/api/push/*` endpoints

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P1: Deploy backend on HDS server
- P1: BLE Bluetooth scale connection in app
- P1: Contact Lefu for API authorization
- P2: More MiniTutos/PageExplainers
- P3: Shopify, WebSocket
