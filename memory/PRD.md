# Chutex Care Watch — PRD

## Problème original
Refondre l'espace d'activité (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/compléments et repas sur-mesure avec assignation par jour de la semaine. Intégrer un calendrier horizontal glassmorphism. Afficher les éléments avec statut de complétion.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Intégrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key)

## DB Collections principales
- `pro_exercise_templates`, `assigned_exercises` (jours, reps, rest_time, completed_dates)
- `pro_reminder_templates`, `pro_assigned_reminders` (jours, time, dosage, image, completions)
- `pro_meal_templates`, `pro_assigned_meals` (jours, meal_time, image, ingredients, steps, macros, completions)
- `pro_notifications`: Actions patient -> coach

## Fichiers clés
- `/app/frontend/src/components/dashboard/ProSpace.tsx` (Hub coach principal)
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx` (Dashboard patient)
- `/app/frontend/src/components/dashboard/constants.ts` (REMINDER_IMAGES)
- `/app/backend/routes/professional_routes.py` (API pro)
- `/app/frontend/app/meal-detail.tsx` (Fiche repas détaillée)

## Fonctionnalités implémentées
- [x] Suppression totale de la notion "Programmes"
- [x] Bibliothèque d'exercices (CRUD) avec seed
- [x] Assignation exercices par jour + séries/repos
- [x] Bibliothèque rappels/compléments + assignation par jour
- [x] Bibliothèque repas + assignation par jour
- [x] Seed backend enrichi : repas avec images, ingrédients structurés, recettes détaillées, macros complètes (glucides, lipides)
- [x] Seed backend enrichi : rappels avec images (medication/hydration)
- [x] Calendrier horizontal glassmorphism (mois complet, flèches navigation)
- [x] **Centrage automatique du calendrier sur le jour J** (interval persistant avec scrollTo, contourne RNW qui reset les scroll positions)
- [x] Affichage exercices/rappels/repas du jour avec statut Fait/A faire
- [x] Images REMINDER_IMAGES dans les compléments
- [x] Images de repas par type (petit_dejeuner, dejeuner, collation, diner)
- [x] Bouton sélecteur bénéficiaire glassmorphism
- [x] Chat WhatsApp-like entre coach et bénéficiaire
- [x] Exercices du jour sur dashboard bénéficiaire (BeneficiaryHome)
- [x] assign_meal copie tous les champs (glucides, lipides, steps, notes)
- [x] assign_reminder copie le champ image

## Note technique importante
React Native Web (RNW) intercepte les mutations DOM et réinitialise scrollLeft lors des re-renders. Le `scrollTo()` direct, `scrollLeft`, `scrollIntoView`, `contentOffset`, `initialScrollIndex` — AUCUN ne fonctionne de manière fiable. Solution: utiliser `setInterval` qui réapplique le scroll toutes les 200ms jusqu'à stabilisation (vérifié 5x consécutives).

## Tâches P1
- [ ] Tableau de bord revenus admin

## Backlog P2
- [ ] Balance/gilet connectés
- [ ] Signature électronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Intégration Vivoo
- [ ] Validation CRC32 TCP

## Refactoring à prévoir
- ProSpace.tsx (1000+ lignes) -> découper en ProCalendar, ProLibrary, AssignmentLists

## Credentials test
- Coach: +33655443322 / test123
- Bénéficiaire (Josette): +33651245918 / test123
