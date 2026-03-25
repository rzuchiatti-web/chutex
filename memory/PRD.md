# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Role Gardien avec interface adaptative.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v8 — Exercices + Complements + Repas assignes par jour
- Calendrier horizontal complet (tous les jours du mois, fleches mois, glass)
- **Exercices**: Bibliotheque -> Assigner a beneficiaire -> Jours/Series/Reps/Repos
- **Complements**: Bibliotheque pré-remplie (12 items: creatine, whey, BCAA, omega3, vitD3, magnesium, zinc, multivit, collagene, glutamine, hydratation, pre-workout) -> Assigner -> Jours/Heure/Dosage
- **Repas**: Bibliotheque pre-remplie (12 items: petitdej proteines, overnight oats, bowl acai, poulet riz, saumon quinoa, salade caesar, steak patate douce, collation post-training, fromage blanc, poisson legumes, omelette du soir, bowl poke) -> Assigner -> Jours/Type de repas
- Filtrage par jour du calendrier pour exercices, complements ET repas
- Edition exercices assignes (modale glass)
- Seed automatique au premier chargement

### Cote Beneficiaire  
- Dashboard: Section exercices du jour (Fait/Faire)
- pro-chat: Design identique a ProMessaging

### Backend APIs nouvelles
| Endpoint | Description |
|---|---|
| POST /api/pro/assign-reminder | Assigner complement a beneficiaire |
| GET /api/pro/assigned-reminders/{benId} | Complements assignes |
| PUT /api/pro/assigned-reminders/{id} | Modifier complement assigne |
| DELETE /api/pro/assigned-reminders/{id} | Retirer complement |
| POST /api/pro/assign-meal | Assigner repas a beneficiaire |
| GET /api/pro/assigned-meals/{benId} | Repas assignes |
| DELETE /api/pro/assigned-meals/{id} | Retirer repas |
| GET /api/pro/beneficiary-today-reminders | Complements du jour (beneficiaire) |
| GET /api/pro/beneficiary-today-meals | Repas du jour (beneficiaire) |
| POST /api/pro/seed-templates | Seed bibliotheque (12 complements + 12 repas) |

## DB Collections
- pro_exercise_templates, pro_assigned_exercises
- pro_reminder_templates, pro_assigned_reminders
- pro_meal_templates, pro_assigned_meals
- pro_notifications, payment_history

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
