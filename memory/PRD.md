# Chutex Care Watch — PRD

## Concept
Application mobile-first de santé connectée. Un **seul rôle Gardien** dont l'interface s'adapte dynamiquement via des attributs (`professional_type`, `saad_company_id`).

## Architecture
- **Frontend**: Expo/React Native (web), Expo Router
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Mollie (paiements), OpenAI GPT-4o (Nora), Lefu (appareils connectés)

## Rôles & Attributs
| Attribut | Valeurs | Impact UI |
|---|---|---|
| `professional_type` | `coach` / `physio` | ProSpace, carte de revenus, onglet Messages, landing pages |
| `saad_company_id` | ID entreprise | Onglet Care, interventions |
| Aucun | Gardien standard | Interface classique santé |

## Fonctionnalités Implémentées

### Session actuelle (Mars 2026)
- **ProSpace (Activité)**: Espace de travail complet pour coachs/physios
  - Onglets pillule: Élèves/Patients + Bibliothèque
  - Dropdown pleine largeur pour sélection de bénéficiaire
  - Quick actions: Programme, Rappel, Repas
  - Modaux glassmorphic (backdrop blur, fond noir)
  - CRUD complet: programmes, exercices, rappels, repas
  - Bibliothèque: modèles réutilisables + duplication vers bénéficiaires
  - API template: `POST /api/pro/programs/template`
- **Fix Messagerie P1**: Padding chat input augmenté (100px) pour éviter chevauchement avec navbar
- **Landing Pages**: `/become-pro` (Coach rouge, Physio orange)
- **Mode Light**: Thème clair par défaut
- **Architecture unifiée**: Fusion Guardian/Professional en un seul rôle
- **Carte de revenus**: Dashboard pro avec endpoint Mollie
- **Navbar dynamique**: GlassTabBar adaptée aux attributs

### Fonctionnalités existantes
- Authentification (téléphone/mot de passe)
- Tableau de bord santé (alertes, données vitales)
- Nora IA (bilans GPT-4o)
- Messagerie pro
- Gestion des bénéficiaires
- Interventions SAAD

## Comptes de Test
| Type | Téléphone | Mot de passe |
|---|---|---|
| Coach | +33655443322 | test123 |
| Gardien SAAD | +33605221196 | test123 |
| Gardien Standard | +33698765432 | test123 |

## Backlog

### P1 — À venir
- Tableau de bord des revenus pour l'administrateur
- Configuration paiements (IBAN) via Mollie pour les pros

### P2 — Futur
- Intégration balance et gilet connectés
- Signature électronique documents Admin
- Système de parrainage Gardiens
- Essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Validation CRC32 serveur TCP J2358

## APIs Clés
- `POST /api/pro/programs/template` — Créer un programme template
- `POST /api/pro/programs/{beneficiary_id}` — Créer un programme pour un bénéficiaire
- `POST /api/pro/programs/duplicate/{program_id}/{beneficiary_id}` — Dupliquer un programme
- `GET /api/pro/all-programs` — Tous les programmes (inclut templates)
- `POST /api/pro/meals/{beneficiary_id}` — Ajouter un repas (format: meal_type, items, calories, proteins, notes)
- `POST /api/pro/reminders/{beneficiary_id}` — Ajouter un rappel
- `GET /api/pro/payment-dashboard` — Dashboard revenus
