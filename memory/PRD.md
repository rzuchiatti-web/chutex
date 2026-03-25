# Chutex Care Watch — PRD

## Concept
Application mobile-first de santé connectée. Un **seul rôle Gardien** dont l'interface s'adapte dynamiquement via des attributs (`professional_type`, `saad_company_id`).

## Architecture
- **Frontend**: Expo/React Native (web), Expo Router
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Mollie (paiements), OpenAI GPT-4o (Nora), Lefu (appareils connectés), SMS Mode (SMS)

## Fonctionnalités Implémentées

### Session actuelle (Mars 2026)

#### Historique des paiements + Export CSV
- Section dépliable "Historique des paiements" dans le dashboard pro
- Liste détaillée: bénéficiaire, date, montant HT (vert), statut
- Bouton "Exporter CSV" → téléchargement fichier CSV (format européen, délimiteur ;)
- APIs: `GET /api/pro/payment-history`, `GET /api/pro/payment-history/export`

#### Refonte ProSpace (Activité)
- Header centré vertical avec icône, titre 26px bold, compteur
- Pilules blanches quand actives
- Bénéficiaire intégré dans le header (dropdown glassmorphic)
- Quick actions + sections avec compteurs + boutons supprimer/dupliquer
- Bibliothèque de modèles réutilisables
- Modaux glassmorphic (fond blur, PAS de carte grise)

#### Refonte Messagerie
- Header centré vertical, titre 26px
- Pilules Conversations / Historique blanches actives

#### Configuration Paiement IBAN
- Modal glassmorphic: Titulaire, IBAN, BIC/SWIFT
- SMS de confirmation via SMS Mode (IBAN masqué)

#### Corrections
- Chat input padding 100px (plus masqué par navbar)

### Fonctionnalités précédentes
- Architecture unifiée Guardian/Professional
- Landing pages /become-pro
- Mode Light par défaut, Carte de revenus, Navbar dynamique

## Comptes de Test
| Type | Téléphone | Mot de passe |
|---|---|---|
| Coach | +33655443322 | test123 |
| Gardien SAAD | +33605221196 | test123 |
| Gardien Standard | +33698765432 | test123 |

## Backlog

### P1 — À venir
- Tableau de bord des revenus pour l'administrateur

### P2 — Futur
- Intégration balance et gilet connectés
- Signature électronique documents Admin
- Système de parrainage Gardiens
- Essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Validation CRC32 serveur TCP J2358

## APIs Clés
| Endpoint | Description |
|---|---|
| `GET /api/pro/payment-history` | Liste des paiements reçus |
| `GET /api/pro/payment-history/export` | Export CSV des paiements |
| `GET /api/pro/payment-config` | Config IBAN actuelle |
| `PUT /api/pro/payment-config` | Sauvegarder IBAN + SMS |
| `GET /api/pro/payment-dashboard` | Dashboard revenus |
| `POST /api/pro/programs/template` | Programme template |
| `POST /api/pro/programs/{ben_id}` | Programme bénéficiaire |
| `POST /api/pro/programs/duplicate/{prog_id}/{ben_id}` | Dupliquer programme |
| `GET /api/pro/all-programs` | Tous programmes |
| `POST /api/pro/meals/{ben_id}` | Ajouter repas |
| `POST /api/pro/reminders/{ben_id}` | Ajouter rappel |
