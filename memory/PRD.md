# CHUTEX HEALTH - PRD (Updated Feb 16, 2026)

## iOS App TestFlight
- https://appstoreconnect.apple.com/apps/6759215592/testflight/ios
- v1.0.5 (latest submitted) - BLE fix + push notifications + PageExplainers

## Redesign "Ultra Clinical" — IN PROGRESS
### Completed
- Design System tokens: colors.ts (B&W dominant, Space, Radius, Type, Glass, Motion, StatusColors)
- Login page: Full redesign (B&W glass, Inter font, no uppercase buttons, fade animation)
- Design guidelines: /app/design_guidelines.json

### In Progress (Next Session)
Priority order:
1. Tab layout (_layout.tsx) — floating glass nav bar
2. Beneficiary Dashboard (index.tsx) — all 6 roles
3. Health, Alerts, Teleconsult, Devices, Profile tabs
4. Sub-pages (alert-detail, scale-detail, etc.)
5. Components (HelpSystem.tsx)
Progress tracker: /app/memory/REDESIGN_PROGRESS.md

## Lefu Scale Integration
- Balance CF597_GNLine detected via BLE
- Weight parsing: QN-Scale protocol (bytes 15-16, /100)
- v1.0.5 submitted with fix — awaiting user test
- SDK native (PPBluetoothKit) — needs lefu.config from Lefu support
- Email drafted for Lefu support (pengsiyuan@lefu.cc)

## Push Notifications — 9 categories + preferences UI
## UX Help Layer — PageExplainers on 4 screens, MiniTutos

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P0: Continue redesign (35+ files remaining)
- P1: Deploy backend on HDS server
- P1: Test v1.0.5 BLE scale on iPhone
- P2: Lefu SDK native integration
- P3: Shopify, WebSocket
