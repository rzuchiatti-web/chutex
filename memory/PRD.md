# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Un seul role Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v6 — Espace Coach/Physio (SANS programmes)
- Header: icone, titre 26px, compteur, pilules glass (10px 24px, fontSize 13)
- Selecteur beneficiaire **pleine largeur glassmorphisme** (fond transparent blur, fleche deroule)
- **Programmes supprimes partout**
- Onglet **Eleves**: Carte Exercices (assignes individuellement) + Rappels + Repas. Bouton "+" pour assigner un exercice depuis la bibliotheque
- Onglet **Bibliotheque**: 3 cartes grises (Exercices, Rappels, Repas) avec boutons "+" dediees
- **Assignation exercice**: Picker bibliotheque → Jours de la semaine (Lun-Dim) → Repetitions / Series / Repos sur-mesure
- L'exercice template (video, image, description, etapes) reste le meme — seuls jours/reps/repos sont personnalises
- **Page pro-exercise-detail.tsx**: hero image, stats, video YouTube, etapes, validation (Valider/Partiel/Passer) avec niveau douleur

### Cote Beneficiaire
- **Page beneficiary-detail**: Section "Exercices prescrits" avec exercices du jour en vert + bouton "Faire" (autres jours en grise)
- Au clic → page detail exercice avec validation
- **Validation visible par le coach** dans les completions

### Messagerie, Paiements, Autres
- Inchanges depuis v5

## APIs Exercices
| Endpoint | Description |
|---|---|
| POST /api/pro/exercise-templates | Creer exercice template |
| GET /api/pro/exercise-templates | Lister templates |
| DELETE /api/pro/exercise-templates/{id} | Supprimer template |
| POST /api/pro/assign-exercise | Assigner exercice avec jours/reps/repos |
| GET /api/pro/assigned-exercises/{benId} | Exercices assignes a un beneficiaire |
| DELETE /api/pro/assigned-exercises/{id} | Retirer assignation |
| GET /api/pro/beneficiary-today-exercises | Exercices du jour (beneficiaire) |
| GET /api/pro/beneficiary-all-exercises | Tous les exercices (beneficiaire) |
| POST /api/pro/exercises/{id}/complete | Valider exercice |

## DB Collections
- `pro_exercise_templates`: Bibliotheque d'exercices reusables
- `pro_assigned_exercises`: Exercices assignes avec jours/reps/repos personnalises + completions
- `payment_history`: Transactions Mollie

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
