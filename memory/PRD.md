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
- [x] In-app Contract Viewer (`ContractViewer.tsx`)
- [x] Teleconsultation forced dark navbar + "Medecin disponible 24/7" pill
- [x] Reactive theming on health.tsx and chat.tsx via 400ms polling
- [x] Program Detail sub-components light mode fix
- [x] Subscription tabs: inactive = icons only, active = icon + label
- [x] Profile page Light Mode refactoring (gray card backgrounds, dark text) — Mar 23, 2026
- [x] Subscription page: onglets centres + titre "Teleassistance Chutex Care" — Mar 23, 2026
- [x] Dashboard: Refonte sections Gardiens et Rappels (cartes individuelles, avatars gris fonce, sous-titres) — Mar 23, 2026
- [x] Separateurs corriges (3 colles supprimes, ajout entre Rappels/Gardiens et avant Teleconsultation) — Mar 23, 2026
- [x] Image IMG_GUARDIANS restauree a cote du titre Mes gardiens — Mar 23, 2026
- [x] DailyObjectives: trait blanc pleine largeur avec marges — Mar 23, 2026
- [x] Batch API: resolution noms/relations gardiens depuis users collection — Mar 23, 2026
- [x] 2 gardiens reels pour Josette (Clement Fils, Claire Fille) avec fiche detail fonctionnelle — Mar 23, 2026

## P0 — Upcoming
- [ ] Balance & Vest Integration (verify data flow with V8 bracelet data)

## P1
- [ ] Electronic Signature System (Admin panel -> Documents tab)

## P2 — Future/Backlog
- [ ] Guardian Referral System
- [ ] Free 7-Day Trial Flow
- [ ] Vivoo Urine Test Integration
- [ ] Refactoring: Backend monolithic route files (program_routes.py, teleassistance_routes.py)
- [ ] Refactoring: Break down profile.tsx (>1000 lines)

## Test Credentials
| Role | Email/Phone | Password |
|------|------------|----------|
| Admin | 0600000001 | admin123 |
| Beneficiary | 0651245918 | test123 |
| Guardian | +33699887766 | test123 |

## Key Files
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`
- `/app/frontend/src/components/dashboard/DailyObjectives.tsx`
- `/app/backend/routes/batch_routes.py`
- `/app/frontend/app/(tabs)/profile.tsx`
- `/app/frontend/src/components/SubscriptionManagePopup.tsx`
- `/app/frontend/app/guardian-detail.tsx`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
