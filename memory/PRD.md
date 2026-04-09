# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de prévention", inspiré du style kora.framer.media. Frontend React (Vite) connecté au backend FastAPI existant.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **i18n** : Géolocalisation auto (ipapi.co) + langue navigateur en fallback, FR/EN
- **Design** : Inspiré Kora, floating pill header, glass morphism, counter animations

## FAIT - Page d'accueil (v3 - style Kora)
- Hero plein écran (banner login app) avec overlay, titre éditorial, "prévention" gradient bleu, CTA, "Trusted by 10,000+ families", logos partenaires
- Header floating pill glass : toujours sombre, logo blanc toujours visible, nav links dans le pill
- Mobile : hamburger glass rond (gauche) | Logo blanc centré | Panier glass rond (droite)
- Boutons séparés glass : drapeau/devise, recherche, compte, panier (badge)
- Section ScrollText : animation mot-par-mot au scroll (Framer Motion useScroll/useTransform)
- Section Avant/Après : carte beige "Sans Chutex" vs carte sombre "Avec Chutex"
- Produits numérotés (01 Elder, 02 Elio, 03 Vita) avec layouts alternés, features grid, prix, témoignage embarqué
- Comment ça marche : 4 phases (Commandez → Activez → Connectez → Protégez)
- Stats dark avec compteurs animés (0.08s, 36h, 50m, 10,000+)
- Section App (App Store/Google Play)
- Témoignages
- Section CTA finale dark
- Footer dark complet
- i18n FR/EN avec drapeaux

## À FAIRE
### P1 - Landing pages
1. Bracelet Elio — Landing + abonnements
2. Gilet Elder — Landing + CTA acheter
3. Balance Vita — Landing + CTA acheter
4. Téléassistance — Service + CTA souscrire
5. L'Application — Fonctionnalités app
6. Accessoires — Socle, câbles, recharges
7. Espace Pro — Professionnels

### P1 - Pages partenaires
8. Coach partenaire — Formulaire
9. Physio partenaire — Formulaire
10. SAAD partenaire — Formulaire

### P1 - Tunnel conversion
11. Souscription Elio → Paiement Mollie
12. Souscription Téléassistance → Paiement Mollie
13. Achat produit → Shopify Checkout

### P2 - Utilitaires
14. Connexion unifiée (même compte app)
15. FAQ, CGV/CGU, Contact

## Stack
React 19 + Vite 6 + Tailwind 3.4 + React Router 7 + Framer Motion 11 + Lucide React
