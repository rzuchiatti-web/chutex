# Chutex Care Watch — PRD

## Concept
Application mobile-first de santé connectée. Un **seul rôle Gardien** dont l'interface s'adapte dynamiquement via des attributs (`professional_type`, `saad_company_id`).

## Architecture
- **Frontend**: Expo/React Native (web), Expo Router
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Mollie (paiements), OpenAI GPT-4o (Nora), Lefu (appareils connectés), SMS Mode (SMS)

## Rôles & Attributs
| Attribut | Valeurs | Impact UI |
|---|---|---|
| `professional_type` | `coach` / `physio` | ProSpace, carte de revenus, onglet Messages |
| `saad_company_id` | ID entreprise | Onglet Care, interventions |
| Aucun | Gardien standard | Interface classique santé |

## Fonctionnalités Implémentées

### Session actuelle (Mars 2026)

#### Refonte ProSpace (Activité)
- Header centré vertical avec icône, titre 26px bold, compteur bénéficiaires
- Pilules **blanches** quand actives (fond blanc, texte noir) sur fond sombre
- Bénéficiaire intégré dans le header (dropdown glassmorphic sur fond blur)
- Quick actions: Programme, Rappel, Repas avec hover accent
- Sections organisées (Programmes, Rappels, Repas) avec compteur
- Chaque item a boutons: Ajouter exercice, Dupliquer, Supprimer
- Onglet Bibliothèque: tous les modèles réutilisables + "Nouveau modèle"
- Modaux **glassmorphic** : fond blur 32px, overlay noir, contenu blanc flottant (PAS de carte grise)

#### Refonte Messagerie
- Header centré vertical (icône, titre 26px, compteur)
- Pilules d'onglets **Conversations / Historique** (même style blanc actif)
- Onglet Historique avec placeholder pour archives

#### Configuration Paiement IBAN
- Modal glassmorphic: Titulaire, IBAN, BIC/SWIFT
- Validation backend (longueur, code pays, titulaire requis)
- **SMS de confirmation** via SMS Mode quand IBAN enregistré (IBAN masqué)
- Indicateur visuel: orange → vert après configuration

#### Corrections P1
- Chat input padding 100px (plus masqué par navbar)

### Fonctionnalités précédentes
- Architecture unifiée (fusion Guardian/Professional)
- Landing pages /become-pro (Coach rouge, Physio orange)
- Mode Light par défaut
- Carte de revenus dashboard pro
- Navbar dynamique GlassTabBar
- API template programmes: POST /api/pro/programs/template

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
| `GET /api/pro/payment-config` | Config IBAN actuelle |
| `PUT /api/pro/payment-config` | Sauvegarder IBAN + SMS confirmation |
| `GET /api/pro/payment-dashboard` | Dashboard revenus |
| `POST /api/pro/programs/template` | Créer programme template |
| `POST /api/pro/programs/{ben_id}` | Créer programme bénéficiaire |
| `POST /api/pro/programs/duplicate/{prog_id}/{ben_id}` | Dupliquer programme |
| `GET /api/pro/all-programs` | Tous programmes (+ templates) |
| `POST /api/pro/meals/{ben_id}` | Ajouter repas |
| `POST /api/pro/reminders/{ben_id}` | Ajouter rappel |
