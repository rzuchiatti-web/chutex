# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Un seul role Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v5 — Espace Coach/Physio
- Header: icone, titre 26px, compteur, pilules glass (10px 24px, fontSize 13)
- Selecteur beneficiaire **pleine largeur glassmorphisme** (350x70px, fond transparent blur, fleche deroule)
- Onglet **Eleves**: 3 cartes grises (Programmes, Rappels, Repas) avec **+ rond** pour lier depuis la Bibliotheque
- Onglet **Bibliotheque**: 4 boutons creation (Programme, **Exercice**, Rappel, Repas) + section Exercices
- **Bibliotheque d'exercices**: CRUD complet (titre, description, image, video, categorie, difficulte, groupe musculaire, series, reps, etapes, materiel)
- **Ajout exercice depuis bibliotheque**: Picker dans la modale d'ajout d'exercice au programme
- **Navigation au clic**: clic programme → `/pro-program-detail`, clic exercice → `/pro-exercise-detail`
- **Page pro-program-detail.tsx**: hero image, stats, description, sessions/exercices
- **Page pro-exercise-detail.tsx**: hero image, stats (series, reps, duree, repos), description, video embed YouTube, etapes numerotees, section validation avec niveau douleur et notes
- Sessions enrichies: image, video_url, steps, difficulty, muscle_group, equipment, from_template_id

### Cote Beneficiaire
- Section **"Mes Programmes"** dans la page sante: affiche programmes prescrits par le coach avec exercices images + bouton "Faire"
- Clic exercice → page detail avec validation (Valider / Partiel / Passer)

### Messagerie
- Header centre, pilules Conversations/Historique (10px 24px, fontSize 13)

### Paiements
- Historique paiements + Export CSV
- Configuration IBAN + SMS confirmation
- Carte de revenus dashboard

### Autres
- Architecture unifiee Guardian/Professional
- Landing pages /become-pro, Mode Light, Navbar dynamique

## APIs
| Endpoint | Description |
|---|---|
| POST /api/pro/exercise-templates | Creer exercice template |
| GET /api/pro/exercise-templates | Lister exercices templates |
| DELETE /api/pro/exercise-templates/{id} | Supprimer exercice template |
| POST /api/pro/upload-image | Upload image (multipart) |
| POST /api/pro/programs/template | Programme template |
| GET /api/pro/programs/detail/{id} | Detail d'un programme pro |
| POST /api/pro/programs/{id}/sessions | Ajouter session/exercice (enrichie) |
| GET /api/pro/my-programs | Programmes prescrits au beneficiaire |
| POST /api/pro/meal-templates | Template repas |
| GET /api/pro/meal-templates | Lister templates repas |
| POST /api/pro/reminder-templates | Template rappel |
| GET /api/pro/reminder-templates | Lister templates rappels |
| POST /api/pro/programs/duplicate/{id}/{ben} | Dupliquer vers beneficiaire |
| GET/PUT /api/pro/payment-config | Config IBAN |
| GET /api/pro/payment-history/export | Export CSV |
| POST /api/pro/sessions/{progId}/{sessId}/complete | Valider exercice |

## DB Collections
- `pro_exercise_templates`: Bibliotheque d'exercices reusables
- `pro_programs`: Programmes avec sessions enrichies (image, video, steps, etc.)
- `payment_history`: Transactions Mollie

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
