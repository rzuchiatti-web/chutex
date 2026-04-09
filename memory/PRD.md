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

### Pages
- `/` — Accueil (Hero + sections)
- `/produits/elio` — Bracelet Elio (+ abonnements intégrés)
- `/produits/vita` — Balance Vita
- `/produits/elder` — Gilet Elder
- `/produits/accessoires` — Accessoires & Recharges (méga-menu)
- `/teleassistance` — Service de Téléassistance
- `/application` — Présentation App + Store buttons
- `/professionnels/saad` — Espace SAAD
- `/professionnels/coach` — Espace Coach
- `/professionnels/kine` — Espace Kinésithérapeute
- `/devenir-distributeur` — Devenir Distributeur
- `/blog` + `/blog/[slug]` — Blog SEO
- `/faq` — FAQ
- `/a-propos` — À propos
- `/contact` — Contact
- `/suivi-commande` — Suivi commande
- `/mon-compte` — Mon compte
- `/cgv`, `/confidentialite`, `/mentions-legales`, `/cookies` — Légal

### Footer (4 colonnes)
| Nos Solutions | Professionnels | Ressources | Légal |
|---|---|---|---|
| Bracelet Elio | Espace SAAD | Blog | CGV |
| Balance Vita | Espace Coach | FAQ | Confidentialité |
| Gilet Elder | Espace Kiné | À propos | Mentions légales |
| Téléassistance | Distributeur | Contact | Cookies |
| Accessoires | | Suivi commande | |
| L'Application | | Mon compte | |

+ Newsletter + App Store/Google Play + Paiements (Visa, MC, PayPal, Apple Pay, Bancontact, iDEAL)

## FAIT
- Hero plein écran (h-screen) vidéo background, glassmorphism, responsive
- Header glassmorphism avec nav complète (6 liens) + langue/recherche/compte/panier
- Overlays Auth (connecté backend), Cart (mocké), Search
- Footer premium ClearPath-style avec 4 colonnes, newsletter, App Store/Google Play, icônes paiement SVG
- Sections sous le Hero (ScrollText, BeforeAfter, Products, HowItWorks, Stats, AppSection, Testimonials, CTA)
- i18n FR/EN complet

## À FAIRE
### P0 - Refonte visuelle sections accueil
- Style glassmorphism cohérent (pas de cartes, éléments posés sur fonds flous)

### P0 - Shopify Storefront API
- Remplacer panier mocké par vrai checkout

### P1 - Landing Pages produits
- Bracelet Elio (+ grille abonnements), Gilet Elder, Balance Vita, Accessoires

### P1 - Téléassistance
- Page de présentation du service

### P1 - L'Application
- Page présentation + boutons stores

### P1 - Pages professionnels
- SAAD, Coach, Kiné, Distributeur (tunnels d'inscription distincts)

### P1 - Contenu SEO
- Blog, FAQ, À propos, Contact

### P2 - Légal
- CGV, Confidentialité, Mentions légales, Cookies

### P2 - Compte client
- Mon compte, Suivi commande

### P3 - App Mobile (EN PAUSE)
- Redesign carte Activité, flux essai gratuit 30j, TCP J2358
