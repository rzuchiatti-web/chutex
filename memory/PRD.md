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
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx` (Dashboard patient)
- `/app/frontend/src/components/dashboard/constants.ts` (REMINDER_IMAGES)
- `/app/backend/routes/professional_routes.py` (API pro)
- `/app/frontend/app/meal-detail.tsx` (Fiche repas detaillee)

## Fonctionnalites implementees
- [x] Suppression totale de la notion "Programmes"
- [x] Bibliotheque d'exercices (CRUD) avec seed
- [x] Assignation exercices par jour + series/repos
- [x] Bibliotheque rappels/complements + assignation par jour
- [x] Bibliotheque repas + assignation par jour
- [x] Seed backend enrichi : repas avec images, ingredients structures, recettes detaillees, macros completes
- [x] Seed backend enrichi : rappels avec images (medication/hydration)
- [x] Calendrier horizontal glassmorphism (mois complet, fleches navigation)
- [x] Centrage automatique du calendrier sur le jour J (interval persistant avec scrollTo)
- [x] Affichage exercices/rappels/repas du jour avec statut Fait/A faire
- [x] Images REMINDER_IMAGES dans les complements
- [x] Images de repas par type (petit_dejeuner, dejeuner, collation, diner)
- [x] Bouton selecteur beneficiaire glassmorphism
- [x] Chat WhatsApp-like entre coach et beneficiaire
- [x] Exercices du jour sur dashboard beneficiaire (BeneficiaryHome)
- [x] assign_meal copie tous les champs (glucides, lipides, steps, notes)
- [x] assign_reminder copie le champ image
- [x] **Unification UI des cartes Complements et Repas** : meme design que les Exercices (fond gris #F4F4F5, image 48x48, badge statut, bouton supprimer) — Mars 2026

## Note technique importante
React Native Web (RNW) intercepte les mutations DOM et reinitialise scrollLeft lors des re-renders. Le `scrollTo()` direct, `scrollLeft`, `scrollIntoView`, `contentOffset`, `initialScrollIndex` — AUCUN ne fonctionne de maniere fiable. Solution: utiliser `setInterval` qui reapplique le scroll toutes les 200ms jusqu'a stabilisation (verifie 5x consecutives).

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
- ProSpace.tsx (1000+ lignes) -> decouper en ProCalendar, ProLibrary, AssignmentLists

## Credentials test
- Coach: +33655443322 / test123
- Beneficiaire (Josette): +33651245918 / test123
