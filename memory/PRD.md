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
- `pro_notifications`: Actions patient -> coach

## Fichiers cles
- `/app/frontend/src/components/dashboard/ProSpace.tsx` (Hub coach principal)
- `/app/frontend/src/components/dashboard/constants.ts` (REMINDER_IMAGES)
- `/app/backend/routes/professional_routes.py` (API pro)

## Fonctionnalites implementees
- [x] Suppression totale de la notion "Programmes"
- [x] Bibliotheque d'exercices (CRUD) avec seed
- [x] Assignation exercices par jour + series/repos
- [x] Bibliotheque rappels/complements + assignation par jour
- [x] Bibliotheque repas + assignation par jour
- [x] Seed backend enrichi
- [x] Calendrier horizontal glassmorphism centrage auto jour J
- [x] Affichage exercices/rappels/repas du jour avec statut Fait/A faire
- [x] Images REMINDER_IMAGES dans les complements
- [x] Bouton selecteur beneficiaire glassmorphism
- [x] Chat WhatsApp-like coach/beneficiaire
- [x] **Fix timezone calendrier** : toLocalDateStr() au lieu de toISOString() — Mars 2026
- [x] **Unification UI cartes** : fond gris #F4F4F5 identique pour Exercices, Complements, Repas — Mars 2026
- [x] **Edit complements assignes** : bouton crayon + modale (jours, heure, dosage) — Mars 2026
- [x] **Edit repas assignes** : bouton crayon + modale (jours, type) + route PUT backend — Mars 2026
- [x] **Suppression templates bibliotheque** : DELETE routes pour reminder-templates et meal-templates — Mars 2026
- [x] **Navigation detail repas** : onClick sur cartes repas vers meal-detail — Mars 2026

## Routes API principales
- `POST /api/pro/exercise-templates` / `DELETE /api/pro/exercise-templates/{id}`
- `POST /api/pro/reminder-templates` / `DELETE /api/pro/reminder-templates/{id}`
- `POST /api/pro/meal-templates` / `DELETE /api/pro/meal-templates/{id}`
- `POST /api/pro/assign-exercise` / `PUT /api/pro/assigned-exercises/{id}` / `DELETE /api/pro/assigned-exercises/{id}`
- `POST /api/pro/assign-reminder` / `PUT /api/pro/assigned-reminders/{id}` / `DELETE /api/pro/assigned-reminders/{id}`
- `POST /api/pro/assign-meal` / `PUT /api/pro/assigned-meals/{id}` / `DELETE /api/pro/assigned-meals/{id}`
- `GET /api/pro/assigned-exercises/{ben_id}` / reminders / meals

## Note technique importante
React Native Web intercepte les mutations DOM et reinitialise scrollLeft. Solution: setInterval + scrollTo. Ne pas modifier le code de centrage du calendrier.

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
- ProSpace.tsx (1100+ lignes) -> decouper en ProCalendar, ProLibrary, AssignmentLists

## Credentials test
- Coach: +33655443322 / test123
- Beneficiaire (Josette): +33651245918 / test123
