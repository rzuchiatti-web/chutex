# CHUTEX - PRD (Product Requirements Document)

## Problème Original
Application santé/coaching (React/Expo Web + FastAPI + MongoDB) pour seniors.

## Architecture
- **Frontend**: Expo Web (React) sur port 3000
- **Backend**: FastAPI sur port 8001
- **Database**: MongoDB
- **Auth**: JWT via AsyncStorage (clé `vl_token`)
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalités Implémentées

### Espace Bénéficiaire
- [x] Dashboard Light Mode (#F4F4F5, textes sombres)
- [x] Carte programme sous objectif de poids
- [x] Nora dans la navbar bénéficiaire (remise 2026-04-01)
- [x] Messagerie dans onglet Navbar "Messages" (Light Mode navbar)
- [x] Vue programme quotidienne en Light Mode
- [x] Validation douleur + notes pour Repas, Hydratation, Compléments
- [x] Auto-assignation exercices depuis bibliothèque
- [x] **Bug Fix: Programme Solo sans équipe ni notifications** (2026-04-01)
- [x] **Fix: TeamActivityToast skip polling pour utilisateurs solo** (2026-04-01)
- [x] **Créer un exercice personnalisé** (formulaire create-self) (2026-04-01)
- [x] **Exercices: Modifier séries/reps/repos derrière bouton crayon** (2026-04-01)
- [x] **Exercices: Modifier poids derrière bouton crayon** (2026-04-01)
- [x] **Exercices: Header simplifié (titre seul, sans icône)** (2026-04-01)
- [x] **Exercices: Graphe SVG d'évolution du poids (cliquable)** (2026-04-01)
- [x] **Exercices: Timer de repos entre séries** (2026-04-01)
- [x] **Exercices: Responsive max-width 480px** (2026-04-01)
- [x] **Navbar Light Mode sur page Messages bénéficiaire** (2026-04-01)

### Espace Coach/Pro
- [x] Gestion programmes, exercices, repas, compléments
- [x] Templates exercices avec bibliothèque
- [x] Notifications de complétion bénéficiaire

## APIs Clés Exercices
- `PUT /api/pro/assigned-exercises/{id}/update-params` - Modifier séries/reps/repos
- `PUT /api/pro/assigned-exercises/{id}/save-weight` - Enregistrer poids
- `POST /api/pro/self-assign-exercise` - Auto-assignation (supporte `__custom__` pour créations perso)
- `GET /api/pro/assigned-exercise-detail/{id}` - Détail avec last_weight_kg, weight_history

## Tâches En Cours / À Venir
### P1 - En attente utilisateur
- Déploiement serveur TCP J2358 sur nouvelle IP

### P2 - Backlog
- Intégration balance/gilet connectés
- Signature électronique, Parrainage Gardiens, Essai gratuit 7j, Vivoo

## Intégrations 3ème Partie
- OpenAI GPT-5.2 (Emergent LLM Key)
- Mollie (paiements - clé utilisateur requise)
- SMS Mode (SMS - clé utilisateur requise)
