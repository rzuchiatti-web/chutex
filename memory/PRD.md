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
- [x] Validation uniquement apres completion exercice
- [x] Images coherentes (backend merge template data)

### Dashboard Beneficiaire
- [x] Carte Sommeil "Whoop-style" (coucher recommande calcule dynamiquement + alarme reveil)
- [x] Carte programme, exercices (compteur X/Y, barre douleur progressive)
- [x] Dispositifs en cartes separees, couleurs uniformes #F4F4F5
- [x] Teleconsultation -> page dediee /teleconsult-doctor
- [x] Nora dans navbar, Messages light mode
- [x] Navigation navbar corrigee (pages hors-tabs)

### Pages Detaillees
- [x] IMC : header avec valeur, jauge, sparkline enrichi, section "Comprendre" complete
- [x] Repas : titre centre, images par type, bouton valider en bas, header sans icone
- [x] Exercices : titre centre, minHeight pleine page
- [x] Boutons retour ronds (borderRadius: 999) partout
- [x] Calendrier dynamique sur toutes les pages (activity, health, metric, glycemia)

### Nora IA — Function Calling (P0 COMPLETE)
- [x] Actions via chat : Nora peut executer des actions reelles depuis le chat
- [x] UPDATE_CALORIES : Modifier l'apport calorique (BLOQUE si objectif poids actif)
- [x] ADJUST_MACROS : Modifier les macronutriments (BLOQUE si objectif poids actif)
- [x] ADD_EXERCISE : Ajouter des exercices (TOUJOURS autorise, avec ou sans objectif)
- [x] CHECK_WEIGHT_GOAL : Verifier si un objectif de poids est en cours
- [x] LIST_EXERCISES : Lister les exercices disponibles dans la bibliotheque
- [x] Regles metier strictes : jamais supprimer les prescriptions gardien/coach
- [x] Cartes de confirmation visuelles (vert succes, rouge echec) dans le chat
- [x] Action markers <<<ACTION:NAME:json>>> parses par le backend

### Bug Fixes
- [x] Programme Solo sans equipe ni notifications
- [x] TeamActivityToast skip pour solo
- [x] Image exercice preservee apres update-params (merge template)
- [x] Navigation navbar depuis pages hors-tabs
- [x] Session ID chat protege contre user?.id undefined

## APIs Cles
- `GET/PUT /api/health/sleep-alarm` — Alarme reveil + coucher recommande
- `GET /api/pro/beneficiary-today-exercises?date=` — Exercices du jour (merge template)
- `PUT /api/pro/assigned-exercises/{id}/update-params` — Modifier series/reps/repos
- `PUT /api/pro/assigned-exercises/{id}/save-weight` — Enregistrer poids
- `POST /api/pro/self-assign-exercise` — Auto-assignation (supporte __custom__)
- `POST /api/chat/message` — Chat Nora avec actions (retourne actions[] si applicables)
- `GET /api/chat/history` — Historique chat incluant actions
- `GET /api/minceur/weight-goal-status` — Statut objectif poids

## Backlog
- P1 : Deploiement TCP J2358
- P2 : Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo

## Refactoring
- pro-exercise-detail.tsx : extraction WeightChart + WorkoutPopup (>600 lignes)
- BeneficiaryHome.tsx : decoupage en sous-composants
