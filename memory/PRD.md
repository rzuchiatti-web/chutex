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
- [x] **Beneficiary-detail REFONTE v4 — Style Clinique Premium** (Mar 23, 2026):
  - Header: BG_RED image, nom centre, bouton "Appeler" slide pleine largeur
  - Safe Zones: texte explicatif, popups aide/formulaire directement sur fond floute
  - Separateurs visuels entre chaque section
  - Style plat/clinique: lignes key-value simples
- [x] **Health Readonly — Page Sante Gardien** (Mar 23, 2026):
  - Endpoints: `GET /api/guardian/beneficiary/{bid}/daily-report` et `metric-history/{key}`
  - Page identique au beneficiaire: HeroScore, ActivityCard, SleepCard, HealthSections
  - Badge "LECTURE SEULE", navigation complete vers metric-detail/health-detail
- [x] **J2358 Bracelet V6 4G — TCP Server** (Mar 24, 2026):
  - Serveur TCP asyncio sur port 9001, protocole binaire J2358
  - Routes HTTP: firmware upload/download, device register, TCP status
- [x] **P0 Fix: Bouton Retour Gardien** (Mar 24, 2026):
  - Ajout fallback `window.location.search` pour `beneficiaryId` dans metric-detail.tsx, health-detail.tsx et health-readonly.tsx
  - Le bouton Retour redirige correctement vers `/health-readonly?beneficiaryId=...` au lieu de `/(tabs)/health`
  - Teste: iteration_143 — 100% PASS
- [x] **Cartes Grises Claires — Fiche Beneficiaire** (Mar 24, 2026):
  - Sections "Informations personnelles" et "Dossier medical" dans des cartes grises arronies (cardGrey/cardBorder)
  - Dark: rgba(255,255,255,0.07), Light: #ECEDF0
  - Teste: iteration_143 — 100% PASS

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
- `/app/frontend/app/beneficiary-detail.tsx` (REFONTE v4 - style clinique)
- `/app/frontend/app/health-readonly.tsx` (Page sante gardien lecture seule)
- `/app/frontend/app/metric-detail.tsx` (Detail metrique avec back button fix)
- `/app/frontend/app/health-detail.tsx` (Detail section sante avec back button fix)
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/backend/routes/guardian_routes.py`
- `/app/backend/services/j2358_tcp_server.py` (Serveur TCP bracelet V6)
- `/app/backend/routes/j2358_routes.py` (Routes firmware/device V6)

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
