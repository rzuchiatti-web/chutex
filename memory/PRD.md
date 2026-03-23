# Chutex Care — Product Requirements Document

## Original Problem Statement
Pixel-perfect redesign of the Beneficiary and Guardian dashboards, Health, Programs, and Profile pages (inspired by biograph.com). Implement Light/Dark mode toggle, overlapping layouts, z-index popups, Guardian dashboard cleanup, Subscription detail cards (Care vs Standard), in-app Contract Viewer, Balance & Vest integration, and electronic signatures on Admin Documents.

## Architecture
- **Frontend**: React Native Web (Expo Router) with conditional inline styling for Light/Dark theme
- **Backend**: FastAPI + MongoDB
- **Theming**: localStorage polling (`chutex_dark`) via `setInterval` in `useEffect` for instant reactivity
- **Popups**: `ReactDOM.createPortal` for z-index bypass

## Completed Features
- [x] Light/Dark mode reactive toggle across all pages
- [x] Redesign Beneficiary/Guardian Dashboards, Health, Programs, Profile pages
- [x] Navbar labels hidden (icons only)
- [x] Subscription detail cards (Care = 3 combined tabs; Standard = flat details)
- [x] In-app Contract Viewer (ContractViewer.tsx)
- [x] Teleconsultation forced dark navbar + "Medecin disponible 24/7" pill
- [x] Reactive theming on health.tsx and chat.tsx via 400ms polling
- [x] Program Detail sub-components light mode fix
- [x] Subscription tabs: inactive = icons only, active = icon + label
- [x] Profile page Light Mode refactoring — Mar 23, 2026
- [x] Subscription page: onglets centres + titre "Teleassistance Chutex Care" — Mar 23, 2026
- [x] Dashboard: Refonte Gardiens/Rappels — Mar 23, 2026
- [x] Navbar fond solide (#16161E dark / #F2F2F6 light) — Mar 23, 2026
- [x] Guardian-detail: refonte avec theme dark/light — Mar 23, 2026
- [x] **Systeme de permissions gardien complet** — Mar 23, 2026:
  - Collection `guardian_permissions` en BD
  - API: GET/PUT permissions beneficiaire + PUT preferences gardien
  - Cote beneficiaire: toggles interactifs alertes (9 types), donnees de sante (7 types), localisation (jamais/alerte/toujours)
  - Cote gardien: opt-in/out alertes, donnees sante, localisation + personnalisation par type d'alerte
  - Messages croisés (beneficiaire voit si gardien refuse, gardien voit si beneficiaire desactive)
  - Bouton "Voir la sante de PRENOM" cote gardien
  - Claire Martin configuree comme gardienne testable (phone: +33612345678, pwd: test123)

## P0 — Upcoming
- [ ] Balance & Vest Integration (verify data flow with V8 bracelet data)

## P1
- [ ] Electronic Signature System (Admin panel -> Documents tab)

## P2 — Future/Backlog
- [ ] Guardian Referral System
- [ ] Free 7-Day Trial Flow
- [ ] Vivoo Urine Test Integration
- [ ] Refactoring: Backend monolithic route files
- [ ] Refactoring: Break down profile.tsx (>1000 lines)

## Test Credentials
| Role | Email/Phone | Password |
|------|------------|----------|
| Admin | 0600000001 | admin123 |
| Beneficiary | 0651245918 | test123 |
| Guardian (Claire) | +33612345678 | test123 |
| Guardian (Marie) | +33699887766 | test123 |

## Key Files
- `/app/backend/routes/guardian_routes.py` (permissions API: lines 821-908)
- `/app/frontend/app/guardian-detail.tsx` (beneficiary side permissions UI)
- `/app/frontend/app/beneficiary-detail.tsx` (guardian side preferences UI)
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`

## DB Collections
- `guardian_permissions`: Per-guardian permissions with beneficiary grants + guardian preferences

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
