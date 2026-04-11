# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de prévention", style glassmorphism, médical, futuriste.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **i18n** : FR/EN avec drapeaux (flagcdn.com)

## Structure du site (Validée)

### Header
`Logo | Bracelet Elio | Balance Vita | Gilet Elder | Téléassistance | Accessoires & Recharges | L'Application | [Langue] [Recherche] [Compte] [Panier]`
- Transition au scroll : blanc/transparent sur hero → noir/glassmorphism après

### Pages
- `/` — Accueil (Hero + sections + TrustSection + Footer)
- `/produits/elio`, `/produits/vita`, `/produits/elder`, `/produits/accessoires`
- `/teleassistance`, `/application`
- `/professionnels/saad`, `/professionnels/coach`, `/professionnels/kine`, `/devenir-distributeur`
- `/blog`, `/blog/[slug]`, `/faq`, `/a-propos`, `/contact`
- `/suivi-commande`, `/mon-compte`
- `/cgv`, `/confidentialite`, `/mentions-legales`, `/cookies`

### Footer (4 colonnes + Newsletter + App Store + Paiements)
Nos Solutions | Professionnels | Ressources | Légal

## Structure Home Page (OFFICIELLE - 11/04/2026)

### Ordre des sections :
1. **Hero** — Vidéo plein écran + animation scroll Kora (400vh)
2. **Products** — Cross-fade cinématique Elio/Vita/Elder (350vh)
3. **Mission** — Présentation société (split: texte + image parallax + piliers glassmorphism)
4. **Solutions** — Écosystème complet (bento grid: 5 cartes produits/services)
5. **AppShowcase** — App mobile (dark section, phone centré, badges flottants)
6. **Teleassistance** — Service 24/7 (image fond parallax, métriques glass, pulse live)
7. **Professionals** — Réseau partenaires (3 cartes portrait: Coach/Kiné/SAAD)
8. **TrustSection** — Avis clients marquee + Logos partenaires
9. **CTASection** — Appel à l'action final

### Architecture fichiers :
- `HomePage.jsx` → imports directs de toutes les sections
- `HowItWorks.jsx` → wrapper temporaire (Mission+Solutions+AppShowcase+Teleassistance+Professionals)
- `Stats.jsx` / `AppSection.jsx` → return null (remplacés)

## FAIT
- Hero plein écran (h-screen) vidéo background, glassmorphism, responsive
- Header glassmorphism avec nav (6 liens) + transition scroll blanc→noir
- Overlays Auth/Cart/Search : plein écran, blur(100px), bg-black/65, body scroll lock, ESC
- Footer premium ClearPath-style : 4 colonnes, newsletter, App Store/Google Play, icônes paiement SVG, bg-white
- TrustSection (Avis clients & Partenaires) avec marquee CSS
- Hero Scroll Animation (400vh, révélation de 4 mots clés au scroll style Kora)
- Products Section cross-fade cinématique au scroll
- SEO balises dans index.html
- i18n FR/EN complet
- **Mission** — Section présentation société avec image parallax + piliers glassmorphism (11/04/2026)
- **Solutions** — Bento grid 5 solutions (Elio, Elder, Vita, App, Téléassistance) (11/04/2026)
- **AppShowcase** — Section dark immersive, phone centré, 6 features badges (11/04/2026)
- **Teleassistance** — Section plein écran image parallax + métriques animées + pulse live (11/04/2026)
- **Professionals** — 3 cartes portrait (Coach, Kiné, SAAD) avec glass overlays (11/04/2026)
- **vite build** compile sans erreur (1964 modules, 483KB JS gzip 149KB) (11/04/2026)

## À FAIRE
### P0 - Cache CDN
- Le proxy CDN de preview cache les anciens modules JS → les nouvelles sections ne s'affichent pas dans l'URL preview
- Code correct en local (vérifié via curl localhost + vite build)
- Le cache expirera automatiquement (TTL estimé 1-4h)

### P0 - Shopify Storefront API
- Remplacer panier mocké par vrai checkout

### P1 - Landing Pages produits
- Bracelet Elio (+ grille abonnements), Gilet Elder, Balance Vita, Accessoires

### P1 - Pages professionnels
- SAAD, Coach, Kiné, Distributeur (tunnels d'inscription distincts)

### P1 - Contenu SEO
- Blog, FAQ, À propos, Contact, Téléassistance, Application

### P2 - Légal + Compte
- CGV, Confidentialité, Mentions légales, Cookies, Suivi commande

### P3 - App Mobile (EN PAUSE)
- Redesign carte Activité, flux essai gratuit 30j, TCP J2358
