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
- [x] **Suppression "Exercices prescrits"** — section retiree de activity-detail.tsx
- [x] **Page Sante light par defaut** — isDark=false quand chutex_dark non defini
- [x] **Refonte page Poids & Nutrition** — header bleu + image balance + barre IMC, calendrier horizontal, Nora
- [x] **Cartes repas/exercices uniformes** — image reelle a gauche, fond gris, texte noir
- [x] **Page Poids & Nutrition v2** — balance supprimee, titre centre, calendrier horizontal
- [x] **Auto-scroll calendrier** — ProCalendar auto-scroll au jour selectionne
- [x] **Bilan hebdomadaire Nora** — section dans l'overlay Nora
- [x] **Calendrier fonctionnel** — donnees mises a jour selon le jour selectionne
- [x] **Refonte sleep page Light Theme** — header violet, white card, gray cards, popups dark
- [x] **Popups explicatives dark** pour dette et regularite du sommeil
- [x] **Renommage cartes Sante** en termes medicaux
- [x] **Light Theme force** sur pages Sante et Programmes
- [x] **Seed templates** accessibles aux gardiens non-pro
- [x] **Refactoring health-detail.tsx** — 1125 -> 470 lignes, 6 composants extraits (2026-03-29)
- [x] **Bug fix KeyError device_type** dans guardian_routes.py ai-report (2026-03-29)
- [x] **Page glycemia-detail** — suppression carte "Que faire?", ajout boutons (i) explicatifs avec popups dark animees (2026-03-29)
- [x] **Calendrier glycemie** — calendrier horizontal + carte stats Plus haut/Moyenne/Plus bas par jour (2026-03-29)
- [x] **Dashboard calories** — carte apport calorique refaite style minceur (fond gris, kcal 38px, eau, macros separees par traits) (2026-03-29)
- [x] **Dashboard dispositifs** — DeviceCards wrappees dans carte grise #F4F4F5 (2026-03-29)
- [x] **Abonnement Sport profil** — carte rouge + popup detaille Chutex Sport (fond rouge, cartes blanches, contrat) (2026-03-29)
- [x] **Refonte exercices dashboard beneficiaire** — cartes horizontales identiques au ProDayView gardien (image 80px gauche, categorie, titre, sets/reps, checkbox, douleur+notes) (2026-03-30)
- [x] **Seed 7 jours donnees bracelet Josette** — 88 readings (HR, SpO2, BP, Temp, Steps, Cal, Dist, HRV, Stress, Recovery, Sleep) + 7 scale + 13 glycemia + 5 ECG (2026-03-30)
- [x] **Fix bug activity-detail** — lecture depuis `report.data` au lieu de `report` directement (2026-03-30)
- [x] **Refonte metric-detail** — calendrier horizontal header, suppression date picker, graphiques animes (stroke-dashoffset, barres qui montent), tooltips dark, swipe/touch, separation objectifs vs seuils alertes (2026-03-30)
- [x] **Moyennes 7J/30J/90J activite** — cartes Pas, Calories, Distance, VO2 Max avec selecteur de periode et badge moyenne (2026-03-30)
- [x] **Moyennes 7J/30J/90J minceur** — cartes Poids, Masse grasse, Masse musculaire avec selecteur et badge (2026-03-30)
- [x] **Refonte graphiques minceur** — courbes bezier lissees, taille augmentee (170px), tooltips dark, labels dates espaces, animation gradient (2026-03-30)
- [x] **API /api/health/metric-averages** — endpoint retournant les moyennes 7j/30j/90j pour N metriques en un seul appel (2026-03-30)
- [x] **Bibliotheque hydratation enrichie** — Templates avec nom, description, ingredients (avec quantites), volume, bienfaits, categorie. 21 templates pre-remplis (smoothies, thes, tisanes, bouillons, eaux aromatisees, jus frais, boissons isotoniques). Formulaire enrichi + affichage premium dans la bibliotheque et les modals d'assignation (2026-03-31)
- [x] **Bibliotheque complements enrichie** — Ajout des champs description, bienfaits, categorie aux templates. 23 complements pre-remplis avec dosages, descriptions medicales et bienfaits detailles (2026-03-31)
- [x] **Seed intelligent dedup** — Le seed ajoute les templates manquants sans supprimer les existants (deduplication par titre). Fonctionne pour exercices, hydratation, complements et repas (2026-03-31)
- [x] **Images reelles pour toute la bibliotheque** — Photos Unsplash/Pexels haute qualite pour 20 exercices (squat, developpe couche, tractions, pompes...), 19 hydratations (smoothies, thes, tisanes, bouillons, jus...) et repas. Mise a jour du seed pour les futurs gardiens (2026-03-31)

## Code Architecture (post-refactoring)
```
/app/frontend/src/components/health/sleep/
  SleepHypnogramCard.tsx    - Carte cycles + stages + interruptions
  SleepQualityCard.tsx      - Barre de qualite du sommeil
  SleepApneaCard.tsx        - Risque d'apnee
  SleepDebtCard.tsx         - Jauge dette + graphe 7j
  SleepRegularityCard.tsx   - Regularite coucher/reveil
  SleepExplainPopup.tsx     - Popup explicative dark unifie
```

## Backlog P0
- [ ] Validation douleur + note pour Complements, Hydratation et Repas (identique aux exercices)

## Backlog P1
- [ ] Deploiement serveur TCP J2358 sur nouvelle IP

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
