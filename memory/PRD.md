# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine. Integrer un calendrier horizontal glassmorphism. Afficher les elements avec statut de completion.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key)

## DB Collections principales
- `pro_exercise_templates`, `assigned_exercises` (jours, reps, rest_time, completed_dates)
- `pro_reminder_templates`, `pro_assigned_reminders` (jours, time, dosage, image, completions)
- `pro_meal_templates`, `pro_assigned_meals` (jours, meal_time, image, ingredients, steps, macros, completions)
- `pro_notifications`, `minceur_daily_cache` (nutrition targets)

## Fichiers cles
- `/app/frontend/src/components/dashboard/ProSpace.tsx` (Hub coach principal)
- `/app/frontend/src/components/dashboard/constants.ts` (REMINDER_IMAGES)
- `/app/frontend/app/meal-detail.tsx` (Detail repas multi-mode)
- `/app/frontend/app/pro-exercise-detail.tsx` (Detail exercice + edit template)
- `/app/backend/routes/professional_routes.py` (API pro)

## Fonctionnalites implementees
- [x] Suppression totale de la notion "Programmes"
- [x] Bibliotheque d'exercices (CRUD) avec seed
- [x] Assignation exercices par jour + series/repos
- [x] Bibliotheque rappels/complements + assignation par jour
- [x] Bibliotheque repas + assignation par jour
- [x] Seed backend enrichi
- [x] Calendrier horizontal glassmorphism centrage auto jour J
- [x] Fix timezone calendrier: toLocalDateStr() au lieu de toISOString()
- [x] Unification UI cartes: fond gris #F4F4F5 identique pour Exercices, Complements, Repas
- [x] Edit complements assignes: bouton crayon + modale (jours, heure, dosage)
- [x] Edit repas assignes: bouton crayon + modale (jours, type) + route PUT backend
- [x] Suppression templates bibliotheque: DELETE routes pour reminder-templates et meal-templates
- [x] Navigation detail repas: onClick sur cartes repas vers meal-detail
- [x] **Carte nutritionnelle** en haut du ProSpace (kcal, eau, proteines/glucides/lipides) — Mars 2026
- [x] **Separation Traitements / Hydratation** dans la page Activite — Mars 2026
- [x] **Suppression section "Tous les exercices"** — seuls les exercices du jour affiches — Mars 2026
- [x] **Images sans cadres gris** (#EDEDEE retire des conteneurs d'images) — Mars 2026
- [x] **Fix page repas vide** : meal-detail.tsx supporte mode assigned/template/beneficiaire — Mars 2026
- [x] **Edition exercice depuis bibliotheque** : formulaire inline dans pro-exercise-detail.tsx (PUT template) — Mars 2026
- [x] **GlassModal bottom sheet** : slide-up depuis le bas + image capsule dans popup assignation — Mars 2026

## Routes API principales
- `POST/DELETE /api/pro/exercise-templates`, `PUT /api/pro/exercise-templates/{id}`
- `POST/DELETE /api/pro/reminder-templates`
- `POST/DELETE /api/pro/meal-templates`
- `POST/PUT/DELETE /api/pro/assigned-exercises/{id}`
- `POST/PUT/DELETE /api/pro/assigned-reminders/{id}`
- `POST/PUT/DELETE /api/pro/assigned-meals/{id}`
- `GET /api/pro/beneficiary-nutrition/{ben_id}` (kcal, macros, eau)
- `GET /api/pro/assigned-meal-detail/{id}` (detail complet)
- `GET /api/pro/meal-template-detail/{id}` (detail template)

## Note technique importante
React Native Web intercepte les mutations DOM et reinitialise scrollLeft. Solution: setInterval + scrollTo.
toISOString() cause un decalage UTC+1 pour les utilisateurs en France. Utiliser toLocalDateStr() partout.

## Taches P1
- [ ] Tableau de bord revenus admin

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP

## Refactoring a prevoir
- ProSpace.tsx (1200+ lignes) -> decouper en ProCalendar, ProLibrary, AssignmentLists

## Credentials test
- Coach: +33655443322 / test123
- Beneficiaire (Josette): +33651245918 / test123
