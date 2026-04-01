# CHUTEX - PRD (Product Requirements Document)

## Problème Original
Application santé/coaching (React/Expo Web + FastAPI + MongoDB) pour seniors. Espace Bénéficiaire, Coach, Guardian, Admin et SAAD.

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
- [x] Suppression du bouton Nora du dashboard
- [x] Messagerie dans onglet Navbar "Messages"
- [x] Vue programme quotidienne (ProgramDailyView) en Light Mode
- [x] Validation douleur + notes pour Repas, Hydratation, Compléments
- [x] Auto-assignation exercices depuis bibliothèque
- [x] Popup ajout exercice (overlay sombre, textes blancs, bouton rouge "Créer")
- [x] **Bug Fix: Programme Solo sans équipe ni notifications** (2026-04-01)
- [x] **Exercices éditables: séries/reps/repos avec +/-** (2026-04-01)
- [x] **Suivi poids (kg) persistant entre séances** (2026-04-01)

### Espace Coach/Pro
- [x] Gestion programmes, exercices, repas, compléments
- [x] Templates exercices avec bibliothèque
- [x] Notifications de complétion bénéficiaire
- [x] Paliers SAAD dans revenue dashboard

### Système
- [x] Bracelet Elio (données vitales simulées)
- [x] Programmes bien-être avec phases/tâches
- [x] Système d'équipe pour programmes duo

## Tâches En Cours / À Venir

### P1 - En attente utilisateur
- Déploiement serveur TCP J2358 sur nouvelle IP

### P2 - Backlog
- Intégration balance/gilet connectés
- Signature électronique documents Admin
- Système de parrainage Gardiens
- Flux essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Vérifier flux "Créer un exercice" personnalisé pour bénéficiaire

## APIs Clés
- `PUT /api/pro/assigned-exercises/{id}/update-params` - Modifier séries/reps/repos
- `PUT /api/pro/assigned-exercises/{id}/save-weight` - Enregistrer poids
- `GET /api/pro/assigned-exercise-detail/{id}` - Détail avec last_weight_kg
- `POST /api/pro/self-assign-exercise` - Auto-assignation exercice
- `GET /api/pro/exercise-library` - Bibliothèque exercices
- `GET /api/programs/active` - Programme actif (team=null si solo)

## Intégrations 3ème Partie
- OpenAI GPT-5.2 (Emergent LLM Key)
- Mollie (paiements - clé utilisateur requise)
- SMS Mode (SMS - clé utilisateur requise)
