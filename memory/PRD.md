# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de prevention", style glassmorphism, medical, futuriste.

## Architecture Technique (UNIFIEE - mai 2026)

| Composant | Stack | Hebergement |
|---|---|---|
| **Site web (CE WORKSPACE)** | React 19 + Vite 6 + Tailwind + Framer Motion | Serveur externe (Docker + Nginx + GitHub Actions `deploy-frontend.yml`) |
| **App mobile** | Expo / React Native | Emergent native (workspace separe) |
| **API backend** | FastAPI + SQLAlchemy 2.x async | Serveur externe `apiprod.chutex-innovation.com` (workflow `deploy-api.yml`) |
| **BDD** | PostgreSQL 16 + JSONB | Serveur externe (workflow `alembic-migrate.yml`) |

**Reseau** : Le conteneur frontend embarque un Nginx qui proxy `/api/*` -> `http://api:8000` (DNS Docker prive `proxy-net`). Aucune route backend n'est exposee publiquement deux fois. MongoDB definitivement abandonne.

## Structure du site (Validee)

### Header
`Logo | Bracelet Elio | Balance Vita | Gilet Elder | Teleassistance | Accessoires & Recharges | L'Application | [Langue] [Recherche] [Compte] [Panier]`
- Transition au scroll : blanc/transparent sur hero -> noir/glassmorphism apres

### Pages
- `/` -- Accueil (Hero + sections + TrustSection + Footer)
- `/produits/elio`, `/produits/vita`, `/produits/elder`, `/produits/accessoires`
- `/teleassistance`, `/application`
- `/professionnels/saad`, `/professionnels/coach`, `/professionnels/kine`, `/devenir-distributeur`
- `/blog`, `/blog/[slug]`, `/faq`, `/a-propos`, `/contact`
- `/suivi-commande`, `/mon-compte`
- `/cgv`, `/confidentialite`, `/mentions-legales`, `/cookies`

## FAIT

### Frontend (Site web)
- Hero plein ecran video, glassmorphism, responsive
- Header glassmorphism + transition scroll
- Overlays Auth/Cart/Search plein ecran
- Footer premium ClearPath-style
- Sections HomePage : Hero, Products (cross-fade cinematique), Mission, Solutions, AppShowcase, Teleassistance, Professionals, TrustSection, CTASection
- Elder Landing Page complete (`/produits/elder`)
- i18n FR/EN, SEO

### E-commerce
- Panier reel + Checkout Mollie (test mode) via `/api/shop/*`
- Catalogue 14+ produits (Elder, Vita, Elio Standard/Sport/Physio/Care, bundles, accessoires)

### Backend (API Postgres)
- **Migration MongoDB -> PostgreSQL** : 122 tables SQLAlchemy + Alembic + Docker + GitHub Actions CI/CD (avr 2026)
- **Vague 1** : 154 endpoints critiques portes (auth, sante, chat, programmes, devices, alerts, intervention, geofences, RGPD, firmware OTA J2358...) (28/04/2026)
- **Vague 2** : +83 endpoints (admin/KPI, professional, contracts/Stripe, advanced/Nora briefing, extras) = 237 total (28/04/2026)
- **Architecture unifiee** : 1 BDD Postgres, 1 API publique `apiprod.chutex-innovation.com`, 2 clients (mobile direct + site web via proxy Nginx interne) (04/05/2026)
- **Vague 3a** : services scoring purs (cardio, sleep, activity, stress, body_age, daily_report, aging) + nora_context SQLAlchemy + branchement chat enrichi + extras detailles. 268 endpoints. 11/11 tests scoring OK (04/05/2026)

### Hygiene workspace (mai 2026)
- Suppression dependance fantome `expo` du `frontend/package.json` (vestige non utilise dans le code)
- Renommage supervisor `[program:expo]` -> `[program:frontend]`
- Nettoyage refs Expo dans `vite.config.js`

## A FAIRE

### P0 - Routes API restantes (Vague 3b - reduite)
- Workflows complets Twilio/Vapi/ElevenLabs (TTS, IVR, speech-response) -- requires API keys
- Stripe Connect complet : onboarding professionnels, transfers, IBAN verify, PDF contrats -- requires API keys
- Bracelet V6 4G TCP J2358 push payloads complets binaires

### P1 - Landing Pages produits
- Bracelet Elio (+ grille abonnements Standard/Sport/Physio/Care)
- Balance Vita
- Coussin Dorsi
- Accessoires & Recharges

### P1 - Pages professionnels
- SAAD, Coach, Kine, Distributeur (tunnels d'inscription distincts)

### P1 - Tunnels de souscription (Abonnements)

### P2 - Contenu SEO
- Blog, FAQ, A propos, Contact, Teleassistance, Application

### P2 - Legal + Compte
- CGV, Confidentialite, Mentions legales, Cookies, Suivi commande

### P3 - App Mobile (workspace SEPARE - hors scope ici)
- Redesign carte Activite, flux essai gratuit 30j, TCP J2358

## Notes critiques pour agent suivant

- **Ce workspace = SITE WEB uniquement**. App mobile dans workspace separe.
- **Deploiement** : pas de natif Emergent ici. GitHub Actions Docker -> serveur externe.
- **API prod** : `apiprod.chutex-innovation.com` (deja deployee, separee).
- **Pas de MongoDB** dans le code applicatif. PostgreSQL uniquement via `/app/migration/api/`.
- L'utilisateur est extremement pointilleux sur le design UI/UX (pixel-perfect, alignement exact).
