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

## FAIT
- Hero plein écran (h-screen) vidéo background, glassmorphism, responsive
- Header glassmorphism avec nav (6 liens) + transition scroll blanc→noir
- Overlays Auth/Cart/Search : plein écran, blur(100px), bg-black/65, body scroll lock, ESC
- Footer premium ClearPath-style : 4 colonnes, newsletter, App Store/Google Play, icônes paiement SVG, bg-white
- **TrustSection** (09/04/2026) : Avis clients style MyHealthPrac (6 cartes défilantes avec portraits AI, étoiles, badge "Avis vérifié", gradient sombre, citations) + Logos partenaires défilants (marquee CSS)
- Sections sous le Hero (ScrollText, BeforeAfter, Products, HowItWorks, Stats, AppSection, Testimonials, CTA)
- i18n FR/EN complet, body blanc pur #FFFFFF

## À FAIRE
### P0 - Refonte visuelle sections accueil
- Style glassmorphism cohérent (pas de cartes, éléments posés sur fonds flous)

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
