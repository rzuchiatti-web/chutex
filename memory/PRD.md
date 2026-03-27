# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key), Web Push (pywebpush + VAPID)

## Charte graphique (DA)
- Light mode par defaut: #F5F5F5, #FFF, #111, #9CA3AF
- isDark = localStorage.getItem('chutex_dark') === '1' (light = defaut quand null)
- GlassModal: overlay + fond opaque rgba(20,20,30,0.82)
- Dropdowns header: rgba(20,20,30,0.88) + blur 24px

## Fonctionnalites implementees
- [x] CRUD exercices/complements/hydratation/repas + seed 20 exercices + 12 repas
- [x] Assignation par jour + series/repos
- [x] Calendrier horizontal glassmorphism
- [x] Carte nutritionnelle + objectif poids (refonte claire avec progression %)
- [x] Sections Traitements / Hydratation / Repas separees
- [x] Edition templates via PUT
- [x] Dropdown glass sombre dans header bibliotheque
- [x] Upload video (mp4, mov, webm) pour exercices
- [x] Merge dynamique assignation/template (video, image, steps)
- [x] Synchronisation Gardien -> Beneficiaire (exercices + repas)
- [x] Popup guide Glass dans ProSpace
- [x] Refonte pages detail en Light Theme
- [x] Login admin par email
- [x] Notifications Push temps reel (WebSocket + Browser Push + In-App)
- [x] Light mode par defaut (BeneficiaryHome, GuardianHome, GlassTabBar)
- [x] Correction macros a 0 (navigation minceur avec mode=assigned + lecture proteines_g)
- [x] Bouton valider vert en bas des pages detail (meal-detail)
- [x] Metadonnees exercice dans le contenu (difficulte, zone, equipement)
- [x] Carte Nutrition/Poids amelioree (progression %, actuel vs objectif, kg restants)
- [x] Admin Revenue Dashboard

## Structure
```
frontend/src/components/dashboard/
  ProSpace.tsx
  NotificationCenter.tsx    (useNotifications, NotificationBanner, NotificationCenter)
  BeneficiaryHome.tsx       (light mode defaut, notifications WS)
  pro/
    ProDayView.tsx          (carte nutrition/poids refaite)
    ProLibrary.tsx
    ProModals.tsx

frontend/app/
  meal-detail.tsx           (bouton valider en bas, macros _g)
  pro-exercise-detail.tsx   (info tags difficulte/zone/equipement)
  minceur.tsx               (navigation pro meals avec assignmentId)
  index.tsx                 (login email admin)

backend/routes/
  notification_routes.py    (CRUD + create_notification + push)
  professional_routes.py    (triggers notifications)
  minceur_routes.py         (injection pro meals avec source/assignment_id)
backend/ws_manager.py       (AdminWSManager + BeneficiaryWSManager)
```

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Unifier style cartes repas/exercices (image-left) sur toutes les pages
- [ ] Refactoring route alerts.tsx (messages vs alertes gardien)

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
