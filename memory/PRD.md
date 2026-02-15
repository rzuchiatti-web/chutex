# CHUTEX HEALTH / CARE WATCH - PRD

## Product Overview
AI-powered teleassistance platform for elderly care with multi-role support (Beneficiary, Guardian, Admin, Teleassistance, Prescriber Company, Intervenant).

## iOS App
- **App Store Connect ID**: 6759215592
- **Name**: Chutex Health
- **Bundle ID**: com.chutex.app
- **TestFlight**: https://appstoreconnect.apple.com/apps/6759215592/testflight/ios
- **Latest IPA**: https://expo.dev/artifacts/eas/6BEiAF2QX2oVACymJRHFxt.ipa
- **Status**: Submitted to TestFlight (Feb 15, 2026) - en attente traitement Apple

## Push Notifications System (Feb 15, 2026)
### Backend Endpoints
- POST `/api/push/register` - Register Expo push token
- POST `/api/push/unregister` - Remove push token
- GET `/api/push/preferences` - Get 9 notification categories
- PUT `/api/push/preferences` - Toggle categories on/off
- POST `/api/push/test` - Test notification
- GET `/api/push/history` - Notification log

### 9 Categories
1. SOS Alerts → guardians on SOS
2. Health Thresholds → guardians on vitals anomaly
3. Fall Detection → guardians + teleassistance
4. Low Battery → beneficiary when device < 20%
5. Hydration Reminders
6. Medication Reminders
7. Alarm Reminders
8. Interventions → intervenants on mission dispatch
9. Guardian Requests → beneficiary on guardian request

### Frontend
- Notification preferences page in Profile (toggles per category)
- expo-notifications for native push
- Web fallback with browser Notification API
- Auto-register push token on login (native only)

## UX Help Layer
- HelpBubble, ContextualTip, OnboardingChecklist, HelpCenter (Phase 1)
- MiniTuto, PageExplainer, EmptyState (Phase 2)
- PageExplainer on Alerts page
- MiniTutos on Beneficiary + Guardian dashboards

## Intervention Pages Redesign
- Admin: KPI summary + rich status cards
- Improved empty states

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Company | saad@chutex.fr | demo123 |

## Backlog
- P1: Add PageExplainer to Sante, Appareils, Teleconsult screens
- P1: More MiniTutos (add beneficiary, activate prescriber, connect device)
- P2: Native BLE testing on real iOS device
- P2: Lefu Scale live data
- P3: Shopify, WebSocket
- P4: Offline mode
