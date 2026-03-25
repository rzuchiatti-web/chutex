# Chutex Care Watch — PRD

## Concept
Application mobile-first de santé connectée. Un seul rôle Gardien dont l'interface s'adapte dynamiquement.

## Architecture
- Frontend: Expo/React Native (web), Expo Router
- Backend: FastAPI, MongoDB
- Intégrations: Mollie, OpenAI GPT-4o, Lefu, SMS Mode

## Implémenté (Mars 2026)

### ProSpace v3 — Espace Coach/Physio
- Header: icône, titre 26px, compteur, pilules glass (10px 24px, fontSize 13)
- Sélecteur bénéficiaire **rond** (cercle initiale, bordure accent)
- Onglet **Élèves**: 3 cartes grises (Programmes, Rappels, Repas) avec **+ rond** qui ouvre un picker depuis la Bibliothèque
- Onglet **Bibliothèque**: 3 boutons de création (Programme, Rappel, Repas)
- **Formulaires riches Programme**: image upload, titre, desc, catégorie, fréquence, durée, exercices/étapes dynamiques (ajout/suppression)
- **Formulaires riches Repas**: image, type, titre, ingrédients dynamiques (nom+qté+unité), étapes de préparation, macros (cal/prot/gluc/lip)
- Modaux glassmorphic **centrés** verticalement et horizontalement, padding-bottom 100px
- Upload d'images: POST /api/pro/upload-image → /api/uploads/{filename}

### Messagerie
- Header centré, pilules Conversations/Historique (10px 24px, fontSize 13)

### Paiements
- Historique paiements + Export CSV
- Configuration IBAN + SMS confirmation
- Carte de revenus dashboard

### Autres
- Architecture unifiée Guardian/Professional
- Landing pages /become-pro, Mode Light, Navbar dynamique

## APIs
| Endpoint | Description |
|---|---|
| POST /api/pro/upload-image | Upload image (multipart) |
| POST /api/pro/programs/template | Programme template |
| POST /api/pro/meal-templates | Template repas (ingrédients, étapes, macros) |
| GET /api/pro/meal-templates | Lister templates repas |
| POST /api/pro/reminder-templates | Template rappel |
| GET /api/pro/reminder-templates | Lister templates rappels |
| POST /api/pro/programs/duplicate/{id}/{ben} | Dupliquer vers bénéficiaire |
| GET/PUT /api/pro/payment-config | Config IBAN |
| GET /api/pro/payment-history/export | Export CSV |

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectés, Signature électronique, Parrainage, Essai 7j, Vivoo, CRC32
