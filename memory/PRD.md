# Chutex Care — Product Requirements Document

## Original Problem Statement
Pixel-perfect redesign of the Beneficiary and Guardian dashboards, Health, Programs, and Profile pages. Implement Light/Dark mode toggle, overlapping layouts, z-index popups, Guardian dashboard cleanup, Subscription detail cards, Balance & Vest integration, and electronic signatures on Admin Documents.

## Architecture
- **Frontend**: React Native Web (Expo Router) with conditional inline styling for Light/Dark theme
- **Backend**: FastAPI + MongoDB
- **Theming**: localStorage polling (`chutex_dark`) via `setInterval` in `useEffect`
- **Popups**: `ReactDOM.createPortal` for z-index bypass

## Completed Features
- [x] Light/Dark mode reactive toggle across all pages
- [x] Redesign Beneficiary/Guardian Dashboards, Health, Programs, Profile pages
- [x] Navbar labels hidden (icons only), fond solide
- [x] Subscription detail cards + In-app Contract Viewer
- [x] Teleconsultation UI + blur cartes
- [x] Reactive theming (polling 400ms)
- [x] Program Detail light mode fix
- [x] Profile page Light Mode + subscription centered tabs
- [x] Dashboard Gardiens/Rappels refonte
- [x] Systeme de permissions gardien complet (alertes 9 types, sante 7 types, localisation 3 modes)
- [x] Guardian-detail refonte avec theme dark/light + permissions interactives
- [x] Beneficiary-detail Dark/Light mode + GlassTabBar GPU fix
- [x] Robert Martin beneficiaire simule pour espace gardien
- [x] **Beneficiary-detail REFONTE COMPLETE v3** — Mar 23, 2026:
  - Structure identique au dashboard: header BG_RED + carte arrondie (24px radius) en dessous
  - Header: back button, nom beneficiaire, badges (age/genre/sang), boutons Appeler/Sante
  - Nouvel ordre des sections:
    1. Informations personnelles (Prenom/Nom/Age/Genre/Naissance/Tel/Adresse/Physique)
    2. Dossier medical (Groupe sanguin/Pathologies/Allergies)
    3. Donnees de sante (grille 2 colonnes: Pouls/SpO2/Tension/Temperature)
    4. Activite physique (Pas/Calories/Distance) - si disponible
    5. Dispositifs (Bracelet/Balance/Gilet)
    6. Preferences (toggles Alertes/Sante/Localisation)
    7. Gardiens (liste cliquable -> modal detail)
    8. Gestion des zones (popup glass explicative + carte OSM + safe zones CRUD)
  - Popup glass "Zones de securite" avec explication fonctionnement
  - Meme tokens couleurs C et effets glass blur que le dashboard
  - Design dark: gradient `linear-gradient(to bottom, #000 0%, #3A3A3C 100%)`
  - Design light: fond blanc `#FFF`
  - Teste 18/18 features (100% success, iteration_141)

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
| Beneficiary (Josette) | 0651245918 | test123 |
| Guardian (Claire) | +33612345678 | test123 |

## Key Files
- `/app/frontend/app/beneficiary-detail.tsx` (REFONTE v3 - dashboard style)
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx` (dashboard reference)
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/backend/routes/guardian_routes.py`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
