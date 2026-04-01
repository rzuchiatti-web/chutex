# CHUTEX - PRD (Product Requirements Document)

## Problème Original
Application santé/coaching (React/Expo Web + FastAPI + MongoDB) pour seniors.

## Architecture
- **Frontend**: Expo Web (React) sur port 3000
- **Backend**: FastAPI sur port 8001
- **Database**: MongoDB
- **Auth**: JWT via AsyncStorage (clé `vl_token`)

## Fonctionnalités Implémentées

### Espace Bénéficiaire - Exercices
- [x] Auto-assignation exercices depuis bibliothèque
- [x] Créer un exercice personnalisé (formulaire create-self)
- [x] Modifier séries/reps/repos via bouton crayon (toggle)
- [x] Modifier poids via bouton crayon (toggle)
- [x] Graphe SVG pleine largeur d'évolution du poids (clic = carte détail)
- [x] Graph se met à jour après sauvegarde poids (re-fetch)
- [x] Timer de repos entre les séries (Commencer l'exercice)
- [x] Header exercice simplifié (titre seul)
- [x] Carte poids: pas d'icône, chiffre gros (28px)
- [x] Images exercices cohérentes (backend merge template data)
- [x] Responsive max-width 480px

### Espace Bénéficiaire - Calendrier Dynamique
- [x] activity-detail: calendrier + exercices par date
- [x] health-detail: calendrier + sommeil/constantes par date
- [x] metric-detail: calendrier + pas/calories/distance par date
- [x] glycemia-detail: calendrier + glycémie par date
- [x] Données de complétion stockées par date exacte

### Espace Bénéficiaire - UI/UX
- [x] Dashboard Light Mode (#F4F4F5)
- [x] Nora dans navbar bénéficiaire
- [x] Messagerie dans onglet "Messages" (navbar Light Mode)
- [x] Programme Solo sans équipe ni notifications
- [x] TeamActivityToast skip pour solo

### APIs Clés
- `GET /api/pro/beneficiary-today-exercises?date=YYYY-MM-DD` - Exercices du jour (merge template)
- `PUT /api/pro/assigned-exercises/{id}/update-params` - Modifier séries/reps/repos
- `PUT /api/pro/assigned-exercises/{id}/save-weight` - Enregistrer poids
- `POST /api/pro/self-assign-exercise` - Auto-assignation (supporte `__custom__`)
- `GET /api/pro/assigned-exercise-detail/{id}` - Détail complet avec weight_history

## Backlog
- P1: Déploiement TCP J2358 (en attente utilisateur)
- P2: Balance/gilet connectés, Signature électronique, Parrainage, Essai 7j, Vivoo
