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
  - Header: BG_RED image, nom centre, bouton "Appeler" slide pleine largeur, SANS pilules
  - Style plat/clinique: lignes key-value simples, ZERO cartes imbriquees
  - Ordre des sections:
    1. Informations personnelles (flat rows: prenom/nom/age/genre/naissance/tel/adresse/taille/poids/IMC)
    2. Dossier medical (groupe sanguin/pathologies/allergies)
    3. Donnees de sante: grille 2x2 des 4 vitales (Pouls/SpO2/Tension/Temperature) — placeholder "--" si pas de donnee
    4. Bouton "Voir la page sante" sous les vitales
    5. Activite physique (pas/kcal/distance) si disponible
    6. Dispositifs (3 en grille plate)
    7. Preferences (toggles + customisation alertes)
    8. Gardiens (liste plate, modal detail)
    9. Gestion des zones + popup glass explicative
  - Palette dark: gradient linear(#0C0C14 -> #1C1C24), light: #FAFAFA
  - Teste: 15/15 features (100% - iteration_142)

## P0 — Upcoming
- [ ] Balance & Vest Integration

## P1
- [ ] Electronic Signature System (Admin -> Documents)

## P2 — Future/Backlog
- [ ] Guardian Referral System
- [ ] Free 7-Day Trial Flow
- [ ] Vivoo Urine Test Integration
- [ ] Refactoring: Backend routes + profile.tsx

## Test Credentials
| Role | Email/Phone | Password |
|------|------------|----------|
| Beneficiary (Josette) | 0651245918 | test123 |
| Guardian (Claire) | +33612345678 | test123 |

## Key Files
- `/app/frontend/app/beneficiary-detail.tsx` (REFONTE v4 - style clinique)
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/backend/routes/guardian_routes.py`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
