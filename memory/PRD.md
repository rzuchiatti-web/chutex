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
- **BLE Integration**: Bracelet/vest Bluetooth connectivity (ready for native testing)

## UX Help Layer (Phase 1 & 2 - Implemented)
- **HelpBubble**: Contextual "?" help buttons
- **ContextualTip**: One-time dismissible tips (SOS, guardian welcome)
- **OnboardingChecklist**: Progressive setup guide (4 steps)
- **HelpCenter**: FAQ with search + support contact
- **MiniTuto**: Step-by-step guided tutorials (beneficiary intro, guardian guide)
- **PageExplainer**: "Comprendre cette page" bottom sheets on key screens (Alerts)
- **EmptyState**: Pedagogical empty states with actions
- **Improved Microcopy**: Better empty state messages across all screens

## Intervention Pages Redesign (Implemented)
- **Admin Interventions Tab**: KPI summary cards (En attente/En cours/Terminées), rich intervention cards with status icons, assigned intervenant info, clickable "Voir le detail"
- **Provider Empty States**: Contextual messages guiding admins to create codes
- **Status-colored cards**: Visual hierarchy with left border colors, status badges

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Company | saad@chutex.fr | demo123 |

## iOS Build Status
- Apple Developer Team ID: 94YZY663N2
- ASC API Key ID: Y782NVC834
- ASC API Key Issuer ID: 4c54dcaa-4ea0-4b6a-97b6-dce1c7fac20f
- Distribution certificate created via Apple API (cert ID: 2K4DU5P8BH)
- Provisioning profile created for com.chutex.app
- **Build Status**: Credentials validation fails on EAS Mac servers (keychain import issue)
- **Recommended**: Run `eas build --platform ios` from a Mac with Xcode for native keychain support

## Backlog
- P1: Complete iOS build via Mac with native keychain
- P1: Mini-tutos for more actions (add beneficiary, activate prescriber mode)
- P1: Admin/Company intervention page further refinements
- P2: Native BLE testing on real devices
- P2: Lefu Scale live data testing
- P3: Shopify integration (blocked on plan upgrade)
- P3: WebSocket for real-time updates
- P4: Offline mode for intervenants
