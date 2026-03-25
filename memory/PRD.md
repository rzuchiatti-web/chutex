# Chutex Care Watch — PRD

## Concept
Application mobile-first de sante connectee. Un seul role Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Integrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implemente (Mars 2026)

### ProSpace v4 — Espace Coach/Physio (CORRIGE)
- Header: icone, titre 26px, compteur, pilules glass (10px 24px, fontSize 13)
- Selecteur beneficiaire **rond glass** (cercle initiale, fond transparent blur, bordure accent)
- Onglet **Eleves**: 3 cartes grises (Programmes, Rappels, Repas) avec **+ rond** qui ouvre un picker depuis la Bibliotheque
- Onglet **Bibliotheque**: 3 boutons de creation (Programme, Rappel, Repas)
- **Navigation au clic**: cliquer sur un programme navigue vers `/pro-program-detail?id=...` (PAS de modale)
- **Page pro-program-detail.tsx**: affichage riche du programme avec stats, description, sessions/exercices
- **Formulaires riches Programme**: image upload, titre, desc, categorie, frequence, duree, exercices/etapes dynamiques
- **Formulaires riches Repas**: image, type, titre, ingredients dynamiques, etapes, macros
- Modaux glassmorphic **centres** verticalement et horizontalement, padding-bottom 100px
- Upload d'images: POST /api/pro/upload-image → /api/uploads/{filename}

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
| POST /api/pro/upload-image | Upload image (multipart) |
| POST /api/pro/programs/template | Programme template |
| GET /api/pro/programs/detail/{id} | Detail d'un programme pro |
| POST /api/pro/meal-templates | Template repas (ingredients, etapes, macros) |
| GET /api/pro/meal-templates | Lister templates repas |
| POST /api/pro/reminder-templates | Template rappel |
| GET /api/pro/reminder-templates | Lister templates rappels |
| POST /api/pro/programs/duplicate/{id}/{ben} | Dupliquer vers beneficiaire |
| GET/PUT /api/pro/payment-config | Config IBAN |
| GET /api/pro/payment-history/export | Export CSV |

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes, Signature electronique, Parrainage, Essai 7j, Vivoo, CRC32
