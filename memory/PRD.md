# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Exercices Beneficiaire
- [x] Auto-assignation depuis bibliotheque + creation personnalisee
- [x] Modifier series/reps/repos (bouton crayon toggle)
- [x] Poids (kg) persistant + graphe SVG evolution
- [x] Popup workout plein ecran (series + timer repos + son/vibration + validation integree)
- [x] Light/Dark mode adaptatif, boutons ronds, responsive 480px

### Dashboard Beneficiaire
- [x] Carte Sommeil "Whoop-style" (coucher recommande + alarme reveil)
- [x] Carte programme, exercices, dispositifs en cartes separees
- [x] Navigation navbar corrigee

### Nora IA — Actions via Chat (COMPLETE)
- [x] UPDATE_CALORIES : Modifier calories (BLOQUE si objectif poids actif)
- [x] ADJUST_MACROS : Modifier macros (BLOQUE si objectif poids actif)
- [x] ADD_EXERCISE : Ajouter exercices (toujours autorise)
- [x] DELETE_EXERCISE : Supprimer exercices Nora uniquement (jamais coach/gardien)
- [x] UPDATE_MEAL_PLAN : Generer plan 4 repas personnalise (allergies, conditions, budget cal)
- [x] LIST_EXERCISES : Lister bibliotheque
- [x] Cartes confirmation visuelles (vert/rouge) pour toutes les actions

### Nora IA — Contexte Enrichi (COMPLETE)
- [x] Exercices du jour : titre, series/reps, statut (fait/a faire), prescripteur
- [x] Nutrition du jour : calories, macros, repas valides/non valides, noms des repas
- [x] Nora peut dire "Vous avez fait 2/9 exercices" ou "Il vous reste 600 kcal"

### Refactoring (COMPLETE)
- [x] pro-exercise-detail.tsx : 606 -> 403 lignes (WeightChart, WorkoutPopup extraits)
- [x] BeneficiaryHome.tsx : 885 -> 707 lignes (SleepAlarm, Exercises, Reminders, Guardians extraits)

## APIs Cles
- `POST /api/chat/message` — Chat Nora avec 6 actions
- `GET/PUT /api/health/sleep-alarm` — Alarme reveil + coucher
- `GET /api/pro/beneficiary-today-exercises` — Exercices du jour
- `PUT /api/pro/assigned-exercises/{id}/update-params` — Modifier series/reps/repos
- `POST /api/pro/self-assign-exercise` — Auto-assignation

## Backlog
- P1 : Deploiement TCP J2358
- P2 : Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo
