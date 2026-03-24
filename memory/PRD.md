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
- [x] P0 Fix: Bouton Retour Gardien (fallback window.location.search)
- [x] Cartes Grises Claires — Fiche Beneficiaire
- [x] Navigation Gardien → Page Detail Gardien (slide-to-call, mode lecture seule)
- [x] **Champs Adresse Separes** (Mar 24, 2026):
  - Modele Pydantic `UserRegister`: postal_code, city, country ajoutes
  - Backend register: stocke les 3 champs en DB
  - SAFE_FIELDS: postal_code, city, country ajoutes (retournes par GET /auth/me)
  - GET /api/guardians/my: renvoie postal_code, city, country par gardien
  - beneficiary-detail: 4 lignes separees (Adresse, Code postal, Ville, Pays)
  - guardian-detail: coordonnees avec 6 champs (tel, email, adresse, cp, ville, pays)
  - Teste: iteration_145 — 100% PASS (5/5 backend + code review frontend)

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
- `/app/frontend/app/beneficiary-detail.tsx`
- `/app/frontend/app/guardian-detail.tsx`
- `/app/frontend/app/health-readonly.tsx`
- `/app/frontend/app/metric-detail.tsx`
- `/app/frontend/app/health-detail.tsx`
- `/app/backend/models.py`
- `/app/backend/auth.py`
- `/app/backend/routes/auth_routes.py`
- `/app/backend/routes/guardian_routes.py`
- `/app/backend/services/j2358_tcp_server.py`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
