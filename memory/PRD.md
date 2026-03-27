# Chutex Care Watch — PRD

## Probleme original
Application sante/coaching avec espace Gardien/Coach (ProSpace) et espace Beneficiaire.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o, Web Push (pywebpush + VAPID)

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
- [x] **Page revenus /pro-revenue** (graphique barres, historique, IBAN)
- [x] **Carte revenus avec image verte** + ecriture blanche
- [x] **Header pro-revenue image verte** (tissu vert sombre)
- [x] **Carte nutrition dark** (kcal geant + eau + macros colores + objectif poids)
- [x] **Cartes beneficiaires style "Mes Gardiens"** (avatar circulaire, 4 vitales)
- [x] Admin Revenue Dashboard

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Unifier style cartes repas/exercices (image-left)

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
