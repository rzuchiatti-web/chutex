# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de prévention", style glassmorphism, médical, futuriste.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **i18n** : FR/EN avec drapeaux (flagcdn.com)

## FAIT - Page d'accueil
- Hero plein écran (h-screen) avec vidéo background, glassmorphism, typographie Inter, responsive 3 lignes
- Header glassmorphism avec logo indépendant, boutons ronds, sélecteur de langue avec drapeaux
- Overlay Auth plein écran (glass blur, sélection pays/préfixes tel, autocomplétion adresse) connecté au backend FastAPI
- Overlay Cart plein écran (glass blur, bannière "Livraison gratuite J+3") - MOCKE
- Overlay Search avec suggestions rapides
- Sections sous le Hero : ScrollText, BeforeAfter, Products, HowItWorks, Stats, AppSection, Testimonials, CTASection
- i18n FR/EN complet

## FAIT - Footer Premium (09/04/2026)
- Design inspiré de ClearPath (clearpath-template.framer.website)
- Image de fond océanique sombre avec overlay teal
- Séparateur courbe SVG (transition douce depuis le contenu)
- Newsletter : titre typographique premium, champ email, bouton "S'abonner" avec point blanc
- Plan du site en 2 colonnes (Produits + Légal/Entreprise)
- Barre inférieure : contact email, icônes sociales (Instagram, Facebook, LinkedIn, YouTube), copyright
- Moyens de paiement : Visa, Mastercard, PayPal, Apple Pay, Bancontact, iDEAL
- Responsive mobile impeccable
- Animations Framer Motion au scroll

## À FAIRE
### P0 - Sections page d'accueil
- Refonte visuelle des composants sous le Hero pour correspondre au style glassmorphism validé (pas de cartes, éléments posés sur fonds flous)

### P0 - Intégration Shopify Storefront API
- Remplacer le panier mocké par le vrai panier/checkout Shopify

### P1 - Landing Pages produits
- Bracelet Elio, Gilet Elder, Balance Vita, Accessoires

### P1 - Tunnels de souscription
- Abonnements Mollie, Téléassistance

### P1 - Pages partenaires
- Coach, Physio, SAAD

### P2 - App Mobile (EN PAUSE)
- Redesign carte Activité dashboard Santé
- Flux essai gratuit 30 jours
- Déploiement serveur TCP J2358
