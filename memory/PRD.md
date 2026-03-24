# Chutex Care — Product Requirements Document

## Original Problem Statement
Pixel-perfect redesign of the Beneficiary and Guardian dashboards, Health, Programs, and Profile pages. Implement Light/Dark mode toggle, overlapping layouts, Guardian dashboard cleanup, Balance & Vest integration, and electronic signatures on Admin Documents.

## Architecture
- **Frontend**: React Native Web (Expo Router), inline conditional Light/Dark styling
- **Backend**: FastAPI + MongoDB
- **Theming**: localStorage polling (`chutex_dark`) via setInterval

## Completed Features
- [x] Light/Dark mode reactive toggle across all pages
- [x] Redesign Beneficiary/Guardian Dashboards, Health, Programs, Profile
- [x] Navbar (GlassTabBar) GPU fix + icons only
- [x] Subscription detail cards + In-app Contract Viewer
- [x] Teleconsultation UI
- [x] Guardian permissions system (9 alert types, 7 health types, 3 location modes)
- [x] Guardian-detail refonte + permissions interactives
- [x] Beneficiary-detail REFONTE v4 — Style Clinique Premium
- [x] Health Readonly — Page Sante Gardien
- [x] J2358 Bracelet V6 4G — TCP Server (port 9001)
- [x] **P0 Fix: Bouton Retour Gardien** (Mar 24, 2026):
  - Fallback `window.location.search` pour beneficiaryId dans metric-detail, health-detail, health-readonly
  - Teste: iteration_143 — 100% PASS
- [x] **Cartes Grises Claires — Fiche Beneficiaire** (Mar 24, 2026):
  - cardGrey/cardBorder pour Infos personnelles et Dossier medical
  - Teste: iteration_143 — 100% PASS
- [x] **Navigation Gardien → Page Detail Gardien** (Mar 24, 2026):
  - Clic sur gardien dans la fiche beneficiaire → navigation vers guardian-detail.tsx (plus de modale)
  - Slide-to-call button identique au header beneficiary-detail
  - Mode lecture seule (pas d'autorisations, pas de suppression) quand fromBeneficiary
  - Bouton Retour → retour sur beneficiary-detail
  - Fallback URL params pour les donnees gardien
  - Teste: iteration_144 — 100% PASS

## P0 — Upcoming
- [ ] Balance & Vest Integration (verify data flow from scale/vest alongside bracelet data)

## P1
- [ ] Electronic Signature System (Admin -> Documents)

## Blocked
- [ ] CRC32 Custom Validation for J2358 TCP Server (waiting manufacturer sample)

## P2 — Future/Backlog
- [ ] Guardian Referral System
- [ ] Free 7-Day Trial Flow
- [ ] Vivoo Urine Test Integration
- [ ] Refactoring: Backend routes + profile.tsx + beneficiary-detail.tsx

## Test Credentials
| Role | Email/Phone | Password |
|------|------------|----------|
| Beneficiary (Josette) | 0651245918 | test123 |
| Guardian (Claire) | +33612345678 | test123 |

## Key Files
- `/app/frontend/app/beneficiary-detail.tsx` (REFONTE v4 - style clinique, navigation gardien)
- `/app/frontend/app/guardian-detail.tsx` (Detail gardien avec slide-to-call + mode lecture seule)
- `/app/frontend/app/health-readonly.tsx` (Page sante gardien lecture seule)
- `/app/frontend/app/metric-detail.tsx` (Detail metrique avec back button fix)
- `/app/frontend/app/health-detail.tsx` (Detail section sante avec back button fix)
- `/app/backend/services/j2358_tcp_server.py` (Serveur TCP bracelet V6)
- `/app/backend/routes/j2358_routes.py` (Routes firmware/device V6)
- `/app/backend/routes/guardian_routes.py`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
