# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key)

## Charte graphique (DA)
- Light mode: #F4F4F5, #111, #9CA3AF
- GlassModal: overlay + fond opaque rgba(20,20,30,0.82)
- Dropdowns header: rgba(20,20,30,0.88) + blur 24px
- Icones exercices: Remix Icon par categorie
- Icones repas: ri-sun-line, ri-restaurant-line, ri-cake-2-line, ri-cup-line, ri-moon-line

## Fonctionnalites implementees
- [x] CRUD exercices/complements/hydratation/repas + seed 20 exercices + 12 repas
- [x] Assignation par jour + series/repos
- [x] Calendrier horizontal glassmorphism
- [x] Carte nutritionnelle + objectif poids
- [x] Sections Traitements / Hydratation / Repas separees
- [x] GlassModal fond sombre opaque sans marge bottom
- [x] Edition templates via PUT (pas duplication POST)
- [x] Dropdown glass sombre dans header bibliotheque
- [x] Navigation carte alerte corrigee (0 alertes -> /alerts)
- [x] TimeWheelPicker pour assignation heure (complement/hydratation)
- [x] Filtre complement exclut hydratation
- [x] Pill tabs avec blur
- [x] Icones dans cartes exercices et repas (au lieu d'images)
- [x] Refactoring ProSpace (6 sous-composants)
- [x] Admin Revenue Dashboard
- [x] TabBar cachee quand GlassModal ouverte
- [x] Upload video (mp4, mov, webm) pour exercices
- [x] Merge dynamique assignation/template (video, image, steps)
- [x] Synchronisation Gardien -> Beneficiaire (exercices + repas)
- [x] Popup guide Glass dans ProSpace (style profile.tsx)
- [x] Refonte pages detail (meal-detail, pro-exercise-detail) en Light Theme
- [x] Correction Dark Mode force (profile.tsx, beneficiary-detail.tsx)
- [x] Login admin par email (detection @ dans formulaire login)
- [x] **Notifications Push en temps reel (WebSocket + Browser Push + In-App)**
  - WebSocket /api/ws/beneficiary pour notifications live
  - Banniere animee slide-in avec shake (NotificationBanner)
  - Centre de notifications (cloche + badge non-lus + dropdown historique)
  - Declenchement auto lors de l'assignation d'exercice, repas ou rappel
  - Notifications navigateur via Web Push API (VAPID)
  - Endpoints CRUD: GET/PUT /api/notifications, /api/notifications/unread-count
  - Stockage MongoDB: collections 'notifications' et 'push_subscriptions'

## Structure
```
frontend/src/components/dashboard/
  ProSpace.tsx              (orchestrateur + libraryFilter + editingTemplateId)
  NotificationCenter.tsx    (useNotifications hook + NotificationBanner + NotificationCenter)
  BeneficiaryHome.tsx       (integre NotificationCenter + WebSocket)
  pro/
    constants.ts            (API, styles, helpers)
    GlassModal.tsx          (Modal, ImagePicker, DaysPicker, TimeWheelPicker)
    ProCalendar.tsx
    ProDayView.tsx
    ProLibrary.tsx
    ProModals.tsx

backend/routes/
  notification_routes.py    (CRUD notifications + push subscription + create_notification helper)
  professional_routes.py    (triggers notification on assign-exercise/meal/reminder)
backend/ws_manager.py       (AdminWSManager + BeneficiaryWSManager)
```

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Refactoring BeneficiaryPopups.tsx
- [ ] Refactoring route alerts.tsx (messages vs alertes gardien)

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
