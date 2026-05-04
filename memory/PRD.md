# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de preventiom", style glassmorphism, medical, futuriste.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **i18n** : FR/EN avec drapeaux (flagcdn.com)

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

### Footer (4 colonnes + Newsletter + App Store + Paiements)
Nos Solutions | Professionnels | Ressources | Legal

## Structure Home Page (OFFICIELLE)

### Ordre des sections :
1. **Hero** -- Video plein ecran + animation scroll Kora (400vh)
2. **Products** -- Cross-fade cinematique Elio/Vita/Elder (350vh)
3. **Mission** -- Presentation societe (split: texte + image parallax + piliers glassmorphism)
4. **Solutions** -- Ecosysteme complet (bento grid: 5 cartes produits/services)
5. **AppShowcase** -- App mobile (dark section, phone centre, badges flottants)
6. **Teleassistance** -- Service 24/7 (image fond parallax, metriques glass, pulse live)
7. **Professionals** -- Reseau partenaires (3 cartes portrait: Coach/Kine/SAAD)
8. **TrustSection** -- Avis clients marquee + Logos partenaires
9. **CTASection** -- Appel a l'action final

### Architecture fichiers :
- `HomePage.jsx` -> imports directs des 9 sections
- Composants : Hero, Products, Mission, Solutions, AppShowcase, Teleassistance, Professionals, TrustSection, CTASection

## FAIT
- Hero plein ecran (h-screen) video background, glassmorphism, responsive
- Header glassmorphism avec nav (6 liens) + transition scroll blanc->noir
- Overlays Auth/Cart/Search : plein ecran, blur(100px), bg-black/65, body scroll lock, ESC
- Footer premium ClearPath-style : 4 colonnes, newsletter, App Store/Google Play, icones paiement SVG, bg-white
- TrustSection (Avis clients & Partenaires) avec marquee CSS
- Hero Scroll Animation (400vh, revelation de 4 mots cles au scroll style Kora)
- Products Section cross-fade cinematique au scroll
- SEO balises dans index.html
- i18n FR/EN complet
- **Mission** -- Section presentation societe avec image parallax + piliers glassmorphism
- **Solutions** -- Bento grid 5 solutions (Elio, Elder, Vita, App, Teleassistance)
- **AppShowcase** -- Section dark immersive, phone centre, 6 features badges
- **Teleassistance** -- Section plein ecran image parallax + metriques animees + pulse live
- **Professionals** -- 3 cartes portrait (Coach, Kine, SAAD) avec glass overlays
- **Nettoyage refactoring** -- Supprime fichiers hacks (HowItWorks, Stats, AppSection, BeforeAfter, ScrollText, Testimonials, StoreLogos), restaure vite.config.js (HMR reactif, watch ignore metro-cache) (11/04/2026)
- **Testing complet** -- 29/29 tests passes, 100% frontend (11/04/2026)

- **Elder Landing Page** -- /produits/elder : 9 sections (Hero dark, Stats glass, How It Works 3 etapes, Protection 4 zones, Technology 6 specs, Lifestyle parallax, Testimonials, Pricing 2 formules, FAQ 6 items + Final CTA). Header adaptatif (scroll threshold different home vs sous-pages). 30/30 tests passes (11/04/2026)

- **Panier reel + Checkout Mollie** -- Panier avec localStorage, catalogue 4 produits (Elder, Elder+Teleassistance, Elio, Vita), selection taille, formulaire livraison, paiement Mollie (test mode), webhook de confirmation, page /commande/confirmation avec polling statut. API: GET /api/shop/products, POST /api/shop/checkout, GET /api/shop/order/{id}, POST /api/shop/mollie/webhook. 32/32 tests passes (13/04/2026)

- **Catalogue complet 14 produits** -- 4 categories (devices, subscriptions, bundles, accessories). Devices: Elder 879EUR, Vita 229EUR. Subscriptions Elio: Standard 24.9EUR/mois, Sport 29.9EUR/mois, Physio 34.9EUR/mois, Care 39.9EUR/mois. Bundles: Elder+Tele, Elio+Elder. Accessoires: cartouches helium x2/x4, chargeurs Elder/Elio, bracelet rechange, housse textile. API filtre par categorie. Homepage redirige vers landing pages (pas d'add to cart). 33/33 tests passes (13/04/2026)

- **Image Elio optimisee** -- SVG 5.3MB converti en WebP : hero 36KB (1200px), card 12KB (600px), thumb 4KB (300px). Compression 150x. References mises a jour dans Products.jsx, Solutions.jsx et shop_routes.py (15/04/2026)

- **Migration complete MongoDB -> PostgreSQL** -- Schema SQLAlchemy 122 tables, scripts Alembic + Mongo->Postgres data transfer, infra Docker (nginx-proxy + Let's Encrypt) + workflows CI/CD GitHub Actions (deploy-frontend, deploy-proxy, deploy-api, alembic-migrate). API externe FastAPI/SQLAlchemy sur api.chutex-innovation.com (avr 2026)

- **Portage massif des routes Mongo -> Postgres SQLAlchemy** -- 154 endpoints actifs (vs 19 au depart) repartis sur 21 modules dans /app/migration/api/routes/ : auth, shop, web, notifications, push, thresholds, health (vitals/ECG/glycemie/weighings), alerts (incl. live-status & tracking), intervention, chat (Nora), devices, bracelet (V6/V8), dorsi, guardian, programs, reminders, minceur, subscriptions/contracts/plans, teleassistance/escalation, pro (conversations/exercices/repas/rappels), geofences/settings/medications/RGPD/streaks, nora caches, firmware OTA J2358, carewatch. Smoke E2E test 12/12 OK contre Postgres local. Workflow deploy-api.yml mis a jour avec EMERGENT_LLM_KEY (28/04/2026)

- **Vague 2 du portage Mongo -> Postgres** -- +83 endpoints supplementaires (237 total) repartis sur 5 modules supplementaires : `admin.py` (codes activation/intervention, KPI, revenue, backoffice users/alerts/prescriptions, devices/health overview, RGPD/SAAD invitations, documents memory/), `professional.py` (profile pro, beneficiaries, exercise/meal/reminder templates CRUD, pro_programs CRUD, dashboard, assignments), `contract.py` (Stripe contracts create/validate/sign/activate avec creation auto Subscription, list, payments, invoices, webhook Stripe basique), `advanced.py` (Nora morning-briefing + weekly-report avec cache + LLM via EMERGENT_LLM_KEY, daily check-in avec streak tracking, predictive-alerts), `extras.py` (glycemia log, vest sync + fall-detection -> alert, batch dashboard, health/extended single-call, daily/sleep/aging summaries, pro-applications status, pro_subscriptions, shopify deprecate stub). URL deploy-api migree de api.chutex-innovation.com -> apiprod.chutex-innovation.com. Smoke E2E v2 16/16 + v1 12/12 = 28/28 OK contre Postgres local (28/04/2026)

- **Architecture finale unifiee : 1 BDD Postgres, 1 API, 2 clients** -- L'application mobile (Flutter) appelle `https://apiprod.chutex-innovation.com` (publique avec SSL Let's Encrypt). Le site web (`prod.chutex-innovation.com`) parle a la MEME api via le reseau Docker prive `proxy-net` : Nginx du conteneur frontend proxy `/api/*` -> `http://api:8000` (DNS Docker interne). Aucune route backend n'est donc exposee deux fois publiquement. MongoDB definitivement abandonne. Frontend `REACT_APP_BACKEND_URL=""` en prod -> paths relatifs. Workflows : `deploy-api.yml` (API publique) + `deploy-frontend.yml` (site web avec proxy interne) + `alembic-migrate.yml` (schema DB) + `deploy-proxy.yml` (nginx-proxy + Let's Encrypt). Diagnostic auto Postgres reachability ajoute dans deploy-api (detection subnet proxy-net + docker0). Healthcheck via Python `urllib` (pas curl, image slim) (04/05/2026)

- **Vague 3a : Nora services metier + Algos scoring complets** -- Cree `/app/migration/api/services/scoring.py` (algorithmes purs : cardio_score, sleep_score, activity_score, stress_score, body_age, daily_report, aging_score) et `/app/migration/api/services/nora_context.py` (port SQLAlchemy du context builder Mongo : profil + abonnement + devices + readings + programme + alertes + objectif poids + reminders + recommandations + thresholds + APP_SERVICES_KNOWLEDGE). Branche le contexte enrichi dans `chat.py` (Nora repond avec full context patient) et `extras.py` (daily-report avec subscores + body_age, aging-summary avec aging composite). 11/11 tests unitaires scoring OK. 268 endpoints actifs (vs 237 fin Vague 2) (04/05/2026)

## A FAIRE
### P0 - Routes API restantes a porter (vague 3 - reduite)
- Workflows complets Twilio/Vapi/ElevenLabs (TTS, IVR, speech-response) — **STUB MINIMAL pour l'instant**
- Logique metier complete Nora services (services/nora_*) : contextes enrichis, actions LLM avec tool calls — **CHAT FONCTIONNE EN MODE LLM SIMPLE**
- Algorithmes complets daily report scoring (subscores cardio/sommeil/stress, agregation 7j/30j) — **CACHE + STATS DE BASE OK**
- Sleep / Body age / aging algorithmes detailes — **LECTURE CACHE OK, CALCULS A PORTER**
- Stripe Connect complet : onboarding professionnels, transfers, IBAN verify, PDF contrats — **CRUD + WEBHOOK BASIQUE OK**
- Bracelet V6 4G TCP J2358 push payloads complets binaires (1262 lignes) — **CONFIG + ECG HISTORY OK**
- Routes Visit intervenant SAAD detaillees (advanced_routes.py - intervenant/visit/*)

### P1 - Landing Pages produits
- Bracelet Elio (+ grille abonnements Standard/Sport/Physio/Care), Balance Vita, Accessoires & Recharges

### P1 - Pages professionnels
- SAAD, Coach, Kine, Distributeur (tunnels d'inscription distincts)

### P1 - Tunnels de souscription (Abonnements)

### P2 - Contenu SEO
- Blog, FAQ, A propos, Contact, Teleassistance, Application

### P2 - Legal + Compte
- CGV, Confidentialite, Mentions legales, Cookies, Suivi commande

### P3 - App Mobile (EN PAUSE)
- Redesign carte Activite, flux essai gratuit 30j, TCP J2358
