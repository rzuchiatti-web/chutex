# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Un seul role Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v7 — Espace Coach/Physio (SANS programmes)
- Header: icone, titre 26px, compteur, pilules glass (10px 24px, fontSize 13)
- Selecteur beneficiaire **pleine largeur glassmorphisme** (fond transparent blur, fleche deroule)
- **Programmes supprimes partout**
- **Calendrier horizontal** sous le selecteur de beneficiaire: affiche 14 jours (-3 a +10), selection d'un jour filtre les exercices
- Onglet **Eleves**: Liste d'exercices filtres par le jour du calendrier avec badges statut (Fait/A faire/Partiel) + Rappels + Repas
- Onglet **Bibliotheque**: 3 cartes grises (Exercices, Rappels, Repas) avec boutons "+" dediees
- **Assignation exercice**: Picker bibliotheque -> Jours de la semaine (Lun-Dim) -> Repetitions / Series / Repos sur-mesure
- **Edition exercice assigne**: Modale d'edition (jours, series, repetitions, repos) via PUT /api/pro/assigned-exercises/{id}
- **Page pro-exercise-detail.tsx**: hero image, stats, video YouTube, etapes, validation (Valider/Partiel/Passer) avec niveau douleur
- **Notifications coach**: Cloche dans le header avec badge compteur non-lus. Panneau deroulant affichant les notifications de completion d'exercices par les beneficiaires. Marquage automatique comme lu a l'ouverture.

### Cote Beneficiaire
- **Page health.tsx**: Affiche les exercices du jour avec bouton "Faire"
- **beneficiary-detail.tsx**: Nettoyee, plus de section "Exercices prescrits" (deplacee dans ProSpace)

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
| GET /api/pro/assigned-exercise-detail/{id} | Detail d'un exercice assigne unique |
| PUT /api/pro/assigned-exercises/{id} | Modifier exercice assigne (jours/reps/repos) |
| DELETE /api/pro/assigned-exercises/{id} | Retirer assignation |
| GET /api/pro/beneficiary-today-exercises | Exercices du jour (beneficiaire) |
| GET /api/pro/beneficiary-all-exercises | Tous les exercices (beneficiaire) |
| POST /api/pro/exercises/{id}/complete | Valider exercice + creer notification |

## APIs Notifications
| Endpoint | Description |
|---|---|
| GET /api/pro/notifications | Liste des notifications du coach (50 max) |
| GET /api/pro/notifications/unread-count | Nombre de notifications non lues |
| PUT /api/pro/notifications/mark-read | Marquer toutes les notifications comme lues |

## DB Collections
- `pro_exercise_templates`: Bibliotheque d'exercices reusables
- `pro_assigned_exercises`: Exercices assignes avec jours/reps/repos personnalises + completions
- `pro_notifications`: Notifications de completion d'exercices pour le coach
- `payment_history`: Transactions Mollie

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
