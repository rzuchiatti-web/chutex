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
- [x] Navbar labels hidden (icons only), fond solide
- [x] Subscription detail cards + In-app Contract Viewer
- [x] Teleconsultation UI + blur cartes
- [x] Reactive theming (polling 400ms)
- [x] Program Detail light mode fix
- [x] Profile page Light Mode + subscription centered tabs
- [x] Dashboard Gardiens/Rappels refonte (cartes individuelles, avatars gris fonce)
- [x] Systeme de permissions gardien complet (alertes 9 types, donnees sante 7 types, localisation 3 modes)
- [x] Guardian-detail refonte avec theme dark/light + permissions interactives
- [x] Beneficiary-detail Dark/Light mode + GlassTabBar GPU fix
- [x] Robert Martin beneficiaire simule pour espace gardien de Josette
- [x] **Beneficiary-detail REFONTE COMPLETE v2** — Mar 23, 2026:
  - Page unique scrollable, SANS onglets, SANS contrat
  - Hero header centre: avatar, nom, badges neutres (age/genre/sang), boutons Appeler/Sante
  - Constantes vitales: grille CSS 3 colonnes (gridTemplateColumns repeat(3,1fr)), zero overflow
  - Carte Nora (analyse IA)
  - Dispositifs: grille 3 colonnes (Bracelet/Balance/Gilet) avec status et batterie
  - Gardiens: liste cliquable avec modal detail
  - Informations: Identite (2 colonnes), Adresse, Physique (3 colonnes), Dossier medical
  - Preferences: toggles Alertes/Sante/Localisation avec personnalisation expandable
  - Historique alertes (resolues/cloturees)
  - Localisation: position GPS, carte OSM, safe zones + CRUD
  - Design minimaliste: palette neutre C.card/C.sep/C.text, couleurs accent uniquement status
  - Fichier reduit de 636 a ~500 lignes
  - Teste: 14/14 features verifiees (100% success)

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
| Role | Email/Phone | Password | Notes |
|------|------------|----------|-------|
| Admin | 0600000001 | admin123 | |
| Beneficiary (Josette) | 0651245918 | test123 | Also has guardian space |
| Guardian (Claire) | +33612345678 | test123 | Gardienne de Josette |
| Guardian (Marie) | +33699887766 | test123 | |
| Beneficiary (Robert) | +33678901234 | - | Beneficiaire de Josette (simule) |

## Key DB Collections
- `guardian_permissions`: Per-guardian bidirectional permissions
- `device_readings`: Bracelet/balance readings (user_id, device_type, timestamp, data{})
- `health_vitals`, `latest_vitals`: Health snapshots
- `alerts`: Guardian/beneficiary alerts
- `weighings`: Weight history
- `geofences`: Safe zones
- `locations`: GPS positions

## Key Files
- `/app/backend/routes/guardian_routes.py` (permissions API + beneficiary endpoints)
- `/app/backend/routes/batch_routes.py` (dashboard batch with guardian resolution)
- `/app/frontend/app/guardian-detail.tsx` (beneficiary side permissions)
- `/app/frontend/app/beneficiary-detail.tsx` (guardian side + preferences - REFONTE v2)
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
