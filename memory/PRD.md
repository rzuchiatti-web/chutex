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

## A FAIRE
### P0 - Shopify Storefront API
- Remplacer panier mocke par vrai checkout

### P1 - Landing Pages produits
- Bracelet Elio (+ grille abonnements), Gilet Elder, Balance Vita, Accessoires

### P1 - Pages professionnels
- SAAD, Coach, Kine, Distributeur (tunnels d'inscription distincts)

### P1 - Tunnels de souscription (Abonnements)

### P2 - Contenu SEO
- Blog, FAQ, A propos, Contact, Teleassistance, Application

### P2 - Legal + Compte
- CGV, Confidentialite, Mentions legales, Cookies, Suivi commande

### P3 - App Mobile (EN PAUSE)
- Redesign carte Activite, flux essai gratuit 30j, TCP J2358
