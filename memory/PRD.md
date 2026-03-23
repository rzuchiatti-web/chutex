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
- [x] **Beneficiary-detail Dark/Light mode** — Mar 23, 2026:
  - isDark state avec polling localStorage 400ms
  - 20+ couleurs adaptatives via objet C (bg, card, text, sub, muted, sep, etc.)
  - GlassCard, SectionTitle, InfoCell, Sep tous thematises
  - Modals (guardian detail, contract popup, safe zone form) adaptes
  - Background image conditionnel (visible seulement en dark mode)
  - Teste: 9/9 features verifiees (100% success)
- [x] **Beneficiary-detail REFONTE COMPLETE** — Mar 23, 2026:
  - Hero header centre: avatar 82px, nom, pilules age/genre/groupe sanguin, boutons Appeler/Sante
  - Bande vitales horizontale scrollable avec gros chiffres colores
  - Navigation par onglets: Dispositifs / Profil / Localisation
  - Dispositifs: grille 3 colonnes avec status badges et batterie
  - Profil: cartes separees (Identite, Adresse, Physique, Dossier medical, Preferences)
  - Localisation: carte OSM + safe zones + bouton ajouter
  - Fichier reduit de 903 a 634 lignes (-30%)
  - Dark/Light mode reactif sur toute la page
- [x] **GlassTabBar GPU acceleration fix** — Mar 23, 2026:
  - Ajout transform: translateZ(0), willChange: backdrop-filter
  - WebkitTransform: translateZ(0) pour compatibilite Safari
  - Fix du bug de disparition du backdrop-filter blur
- [x] **Robert Martin** beneficiaire simule pour espace gardien de Josette — Mar 23, 2026:
  - Profil complet: 80 ans, homme, 172cm/78kg, A+, Hypertension, Penicilline
  - 42 device_readings (bracelet V8 + balance S2, 7 jours)
  - Constantes vitales: FC, SpO2, temperature, pas, calories, HRV
  - 14 pesees (balance)
  - 3 alertes historiques (chute, FC elevee, inactivite)
  - 2 dispositifs (Bracelet Elio, Balance Vita)
  - 1 safe zone (Domicile Robert, Lyon)
  - Localisation GPS
  - Permissions gardien configurees (tout autorise par defaut)
  - Josette activee en mode gardien (has_guardian_space=true, active_role=guardian)

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
- `/app/frontend/app/beneficiary-detail.tsx` (guardian side + preferences)
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- Stripe (Payments) — requires User API Key
