# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Un seul role Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v7 — Espace Coach/Physio (SANS programmes)
- Header: icone, titre 26px, compteur, pilules glass
- Selecteur beneficiaire pleine largeur glassmorphisme
- Calendrier horizontal avec tous les jours du mois + fleches navigation mois + mois en blanc
- Onglet Eleves: Liste exercices filtres par jour + badges statut (Fait/A faire/Partiel) + Rappels + Repas
- Onglet Bibliotheque: Exercices, Rappels, Repas avec boutons "+"
- Assignation exercice: Picker bibliotheque -> Jours -> Reps/Series/Repos
- Edition exercice assigne: Modale glassmorphisme (jours, series, reps, repos)
- Notifications coach: Cloche + panneau deroulant
- Boutons actions: ronds + glassmorphisme

### Cote Beneficiaire
- **BeneficiaryHome.tsx**: Section "Exercices du jour" prescrit par coach avec statut Fait/Faire
- **health.tsx**: Affiche exercices du jour avec bouton Faire
- **pro-chat.tsx**: Design identique a ProMessaging (fond clair, header rouge, bulles WhatsApp)
- **beneficiary-detail.tsx**: Nettoyee, exercices deplaces dans ProSpace

### Messagerie, Paiements, Autres
- Inchanges depuis v5

## APIs Exercices
| Endpoint | Description |
|---|---|
| POST /api/pro/exercise-templates | Creer exercice template |
| GET /api/pro/exercise-templates | Lister templates |
| DELETE /api/pro/exercise-templates/{id} | Supprimer template |
| POST /api/pro/assign-exercise | Assigner exercice |
| GET /api/pro/assigned-exercises/{benId} | Exercices assignes |
| GET /api/pro/assigned-exercise-detail/{id} | Detail exercice assigne |
| PUT /api/pro/assigned-exercises/{id} | Modifier exercice assigne |
| DELETE /api/pro/assigned-exercises/{id} | Retirer assignation |
| GET /api/pro/beneficiary-today-exercises | Exercices du jour (beneficiaire) |
| GET /api/pro/beneficiary-all-exercises | Tous exercices (beneficiaire) |
| POST /api/pro/exercises/{id}/complete | Valider exercice + notification |

## APIs Notifications
| Endpoint | Description |
|---|---|
| GET /api/pro/notifications | Liste notifications coach |
| GET /api/pro/notifications/unread-count | Compteur non-lus |
| PUT /api/pro/notifications/mark-read | Marquer comme lu |

## DB Collections
- pro_exercise_templates, pro_assigned_exercises, pro_notifications, payment_history

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
