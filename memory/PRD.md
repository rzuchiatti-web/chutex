# Chutex Care Watch — PRD

## Probleme original
Application sante/coaching avec espace Gardien/Coach (ProSpace) et espace Beneficiaire.
L'objectif est une UI Glassmorphism + Light mode avec synchronisation en temps reel via WebSockets.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-5.2 (via Emergent LLM Key), Web Push (pywebpush + VAPID)

## Fonctionnalites implementees
- [x] CRUD exercices/complements/hydratation/repas + seed
- [x] Assignation par jour + notifications push temps reel
- [x] Merge dynamique assignation/template (video, image, steps)
- [x] Login admin par email
- [x] Notifications Push (WebSocket + Browser Push + In-App)
- [x] Light mode par defaut
- [x] Correction macros a 0 (navigation minceur + champs _g)
- [x] Bouton valider en bas des pages detail
- [x] Metadonnees exercice dans le contenu
- [x] Page revenus /pro-revenue (graphique barres, historique, IBAN)
- [x] Carte revenus avec image verte + ecriture blanche
- [x] Header pro-revenue image verte (tissu vert sombre)
- [x] Carte nutrition dark (kcal geant + eau + macros colores + objectif poids)
- [x] Cartes beneficiaires style "Mes Gardiens" (avatar circulaire, 4 vitales)
- [x] Admin Revenue Dashboard
- [x] NoraOverlay pattern (lazy loading LLM — cout GPT reduit)
- [x] Page activity-detail light theme (header image + calendrier swipe + cartes grises)
- [x] **Routeur Nora unifie** — /api/nora/analysis?context=X + /api/nora/analysis-history (refactoring)
- [x] **Page glycemia-detail light theme** (header image + conteneur blanc + cartes grises)
- [x] **Page metric-detail light theme** (header image + conteneur blanc + cartes grises)
- [x] **Historique analyses Nora** (/nora-history) accessible depuis le profil beneficiaire
- [x] **Suppression "Exercices prescrits"** — section retirée de activity-detail.tsx, logique simplifiée (Coach exercises OU Nora exercises)
- [x] **Page Sante light par defaut** — isDark=false quand chutex_dark non defini dans localStorage
- [x] **Refonte page Poids & Nutrition** — header bleu + image balance + barre IMC, carte blanche arrondie, Nora en haut, 3 graphiques separes (poids, graisse, muscle), apport calorique, section exercices, goal form en popup dark glass
- [x] **Cartes repas uniformes** — image reelle a gauche, fond gris #F4F4F5, texte noir, design identique dans ProDayView et minceur.tsx
- [x] **Cartes exercices uniformes** — image a gauche, fond gris, texte noir, design identique dans ProDayView et activity-detail.tsx
- [x] **Page Poids & Nutrition v2** — balance supprimée, titre centré, poids+IMC+barre centrés, calendrier horizontal identique (ProCalendar), exercices supprimés de la page
- [x] **Auto-scroll calendrier** — ProCalendar auto-scroll au jour selectionne/courant (centrage automatique)
- [x] **Bilan hebdomadaire Nora** — section "Bilan hebdomadaire" dans l'overlay Nora (poids/graisse/muscle avec delta 7 jours)

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
