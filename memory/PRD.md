# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key), Web Push (pywebpush + VAPID)

## Charte graphique (DA)
- Light mode par defaut: #F5F5F5, #FFF, #111, #9CA3AF
- isDark = localStorage.getItem('chutex_dark') === '1' (light = defaut)
- GlassModal: overlay + fond opaque rgba(20,20,30,0.82)
- Pages detail: header image + contenu blanc arrondi overlappant

## Fonctionnalites implementees
- [x] CRUD exercices/complements/hydratation/repas + seed 20 exercices + 12 repas
- [x] Assignation par jour + series/repos + notifications push
- [x] Calendrier horizontal glassmorphism
- [x] Carte nutritionnelle + objectif poids (refonte claire avec progression %)
- [x] Upload video (mp4, mov, webm) pour exercices
- [x] Merge dynamique assignation/template (video, image, steps)
- [x] Synchronisation Gardien -> Beneficiaire (exercices + repas)
- [x] Popup guide Glass dans ProSpace
- [x] Login admin par email
- [x] Notifications Push temps reel (WebSocket + Browser Push + In-App)
- [x] Light mode par defaut
- [x] Correction macros a 0 (navigation minceur avec mode=assigned)
- [x] Bouton valider vert en bas des pages detail
- [x] Metadonnees exercice dans le contenu (difficulte, zone, equipement)
- [x] **Page revenus dediee /pro-revenue** (3 onglets: Apercu/Historique/Compte bancaire)
- [x] **Carte revenus simplifiee** dans le dashboard gardien (icone verte, fleche)
- [x] **Messagerie coach/physio** fonctionnelle sans erreur serveur
- [x] Admin Revenue Dashboard

## Structure cles
```
frontend/app/
  pro-revenue.tsx           (PAGE: gestion revenus + IBAN + historique)
  meal-detail.tsx           (bouton valider en bas, macros _g)
  pro-exercise-detail.tsx   (info tags difficulte/zone/equipement)
  minceur.tsx               (navigation pro meals avec assignmentId)

frontend/src/components/dashboard/
  GuardianHome.tsx          (carte revenus simplifiee vers /pro-revenue)
  BeneficiaryHome.tsx       (light mode defaut, notifications WS)
  NotificationCenter.tsx    (useNotifications, NotificationBanner)
  pro/ProDayView.tsx        (carte nutrition/poids refaite)

backend/routes/
  notification_routes.py    (CRUD + create_notification + push)
  professional_routes.py    (triggers notifications)
```

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Unifier style cartes repas/exercices (image-left) sur toutes les pages
- [ ] Refactoring route alerts.tsx

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
