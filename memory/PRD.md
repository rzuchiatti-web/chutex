# Chutex Care - PRD

## Vision
Site web ultra-premium "clinique digitale de prévention", inspiré du style kora.framer.media.

## Architecture Technique
- **Frontend** : React (Vite) + Tailwind CSS + React Router + Framer Motion, port 3000
- **Backend** : FastAPI existant (MongoDB, auth, Mollie), port 8001
- **i18n** : FR/EN avec drapeaux (flagcdn.com)

## FAIT - Page d'accueil (v4)
- Hero plein écran avec:
  - Logo CHUTEX blanc centré indépendant (gros)
  - Nav pill glass à gauche avec animation hover scale
  - Boutons glass séparés à droite (drapeau, recherche, compte, panier badge)
  - Mobile : hamburger glass rond | logo centré | panier glass rond
  - Titre éditorial + "prévention" gradient bleu
  - 5 avatars ronds (seniors heureux + médecins)
  - 5 étoiles vertes + "Recommandé par les professionnels de santé"
  - Logos partenaires magasin (Decathlon, RedCare, Quirumed, Castorama, MediaMarkt, Stadium) via mix-blend-screen
- ScrollText mot-par-mot au scroll
- Avant/Après (beige vs dark)
- Produits numérotés (01 Elder, 02 Elio, 03 Vita) layouts alternés
- 4 phases "Comment ça marche"
- Stats dark compteurs animés
- Section App (Store links)
- Témoignages + CTA final + Footer dark
- i18n FR/EN complet

## À FAIRE
### P1 - Landing pages produits + tunnels conversion
### P2 - Pages partenaires + utilitaires (FAQ, CGV, Contact, Connexion)
