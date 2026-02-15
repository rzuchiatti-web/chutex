# CHUTEX / CARE WATCH - PRD

## Product Overview
AI-powered teleassistance platform for elderly care with multi-role support (Beneficiary, Guardian, Admin, Teleassistance, Prescriber Company, Intervenant).

## Core Features (Implemented)
- **Multi-role Dashboard**: 6 role-specific dashboards with real-time data
- **SOS Alert System**: One-tap emergency alerts with AI-driven CARE WATCH protocol
- **Smart Alert Dispatch**: Auto-dispatch to nearest SAAD company via AI
- **Uber-Style Tracking**: Real-time intervenant tracking on map
- **B2B Prescriber Portal**: Full CRUD for prescribers, agencies, commissions
- **Intervention Management**: Complete lifecycle from dispatch to closure with QCM reports
- **Lefu Smart Scale**: Backend endpoints + detailed measurement display page
- **Analytics Dashboards**: Admin & Company performance metrics
- **Gamified Rewards**: Monthly prescriber challenge with prizes
- **BLE Integration**: Bracelet/vest Bluetooth connectivity

## Push Notifications System (NEW - Feb 15, 2026)
### Backend (`/app/backend/routes/push_routes.py`)
- POST `/api/push/register` - Register Expo push token
- POST `/api/push/unregister` - Remove push token
- GET `/api/push/preferences` - Get 9 configurable notification categories
- PUT `/api/push/preferences` - Toggle individual categories on/off
- POST `/api/push/test` - Send test notification
- GET `/api/push/history` - View sent notifications log

### Notification Categories
1. **SOS Alerts** → Push to guardians when beneficiary triggers SOS
2. **Health Thresholds** → Push when vitals exceed safe ranges (HR, SpO2, temp)
3. **Fall Detection** → Push to guardians + teleassistance on fall
4. **Low Battery** → Push when device < 20% (bracelet, vest, scale)
5. **Hydration Reminders** → Scheduled push for hydration
6. **Medication Reminders** → Scheduled push for treatments
7. **Alarm Reminders** → General scheduled reminders
8. **Interventions** → Push to intervenants when mission dispatched
9. **Guardian Requests** → Push when someone requests guardian access

### Frontend (`/app/frontend/src/services/notifications.ts`)
- `registerForPushNotifications()` - Registers Expo Push Token + sends to backend
- `scheduleReminderNotification()` - Native scheduled notifications for reminders
- `addNotificationResponseListener()` - Handle notification tap for navigation
- Android channels: sos (MAX), health (HIGH), reminders (DEFAULT), battery (LOW)

### Integration Points
- `alert_routes.py` → calls `notify_sos_alert()` / `notify_fall_detected()` on alert creation
- `device_routes.py` → calls `notify_health_threshold()` on anomaly + `notify_low_battery()` on low battery sync

## UX Help Layer (Phase 1 & 2)
- HelpBubble, ContextualTip, OnboardingChecklist, HelpCenter
- MiniTuto, PageExplainer, EmptyState (Phase 2)
- Improved microcopy across empty states

## Intervention Pages Redesign
- Admin Interventions Tab: KPI summary + rich cards with status icons
- Better empty states with contextual guidance

## iOS Build (COMPLETE - Feb 15, 2026)
- **IPA**: https://expo.dev/artifacts/eas/6BEiAF2QX2oVACymJRHFxt.ipa
- **Build**: https://expo.dev/accounts/chutex/projects/chutex/builds/2d78549f-eec8-4d4b-a5b2-8ad6a6437d55
- Distribution certificate + provisioning profile created via Apple API
- To submit to TestFlight: `eas submit --platform ios --profile production`

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Company | saad@chutex.fr | demo123 |

## Backlog
- P1: Submit IPA to TestFlight (`eas submit --platform ios`)
- P1: Add notification preferences UI page in Profile tab
- P1: Complete remaining MiniTutos and PageExplainers
- P2: Native BLE testing on real devices
- P2: Lefu Scale live data testing
- P3: Shopify integration (blocked on plan upgrade)
- P3: WebSocket for real-time updates
- P4: Offline mode for intervenants
