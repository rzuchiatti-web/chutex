# Chutex Care - PRD

## Vision
Site web premium "clinique digitale de prévention", ultra optimisé à la conversion. Frontend React (Vite) connecté au backend FastAPI existant + Shopify backend pour les commandes physiques.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **Shopify** : Backend commandes physiques via API Storefront
- **i18n** : Géolocalisation auto (ipapi.co) + langue navigateur en fallback, FR/EN
- **Design** : Swiss & High-Contrast, fonts Outfit + Work Sans, glassmorphism header

## Offres Commerciales

### Produits physiques (Shopify Checkout)
1. Gilet airbag Elder — 879€ TTC
2. Balance Vita — 229€ TTC
3. Recharge airbag lot de 2 — 119.8€ TTC
4. Socle de recharge Elio (Bluetooth/4G) — 29.9€ TTC
5. Câble de recharge Elder — 29.9€ TTC
6. Câble de charge USB-C — 14.9€ TTC

### Abonnements (Mollie)
7. Bracelet Elio Standard — 24.9€/mois ou 249€/an
8. Bracelet Elio Sport — 99€/mois
9. Bracelet Elio Physio — 99€/mois
10. Téléassistance — 39.9€/mois + 50% crédit d'impôt

## Pages du site

### FAIT - Page d'accueil (v2 - redesign premium)
- Hero plein écran (image login app) avec overlay sombre, titre blanc centré, "prévention" en gradient bleu
- Header glassmorphism : transparent/blanc sur hero → glass blanc/noir en scroll
- Icônes : Recherche, Compte, Panier (badge)
- Sélecteur langue avec drapeaux (FR/EN) via flagcdn.com
- Animations hover futuristes (glow, scale, underline animé)
- Logo switch blanc/noir selon scroll
- Barre logos magasins partenaires (Decathlon, RedCare, etc.)
- Grille bento produits (Elder, Elio, Vita) avec prix
- Chiffres clés (0.08s, 36h, 50m, 10+ jours)
- Section application (App Store + Google Play)
- Témoignages (3 profils)
- Section CTA finale dark
- Footer dark complet
- Responsive mobile-first + menu hamburger
- i18n FR/EN avec géolocalisation auto

### À FAIRE - Pages principales
1. **Bracelet Elio** — Landing page + abonnements
2. **Gilet Elder** — Landing page + CTA acheter
3. **Balance Vita** — Landing page + CTA acheter
4. **Téléassistance** — Présentation service + CTA souscrire
5. **L'application** — Présentation fonctionnalités app
6. **Accessoires** — Socle, câbles, recharges
7. **Espace Pro** — Page professionnels

### À FAIRE - Pages partenaires
8. **Devenir Coach partenaire** — Formulaire inscription
9. **Devenir Physio partenaire** — Formulaire inscription
10. **Devenir SAAD partenaire** — Formulaire inscription

### À FAIRE - Tunnel de conversion
11. **Souscription Elio** — Choix formule → Infos → Paiement Mollie
12. **Souscription Téléassistance** — Choix → Infos → Paiement Mollie
13. **Achat produit** — Panier → Shopify Checkout

### À FAIRE - Pages utilitaires
14. **Connexion** — Login unifié (même compte que l'app)
15. **FAQ**
16. **Mentions légales / CGV / CGU**
17. **Contact**

## Stack Technique
- React 19 + Vite 6 + Tailwind CSS 3.4
- React Router 7
- Framer Motion 11
- Lucide React (icônes)
- i18n custom (Context API)
- Flags: flagcdn.com

## Style
- Premium, clinique digital, médical
- Couleurs : Primary #0055FF, BG #FAFAFA, Dark footer #0F172A
- Typographie : Outfit (headings), Work Sans (body)
- Header : Glassmorphism avec backdrop-blur
- Hover : Glow effects, scale, animated underlines
- Pas de fioritures, focus clarté + confiance + conversion
