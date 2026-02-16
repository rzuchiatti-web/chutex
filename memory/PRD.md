# CHUTEX HEALTH - PRD (Updated Feb 16, 2026)

## Design Direction: "Clinical Digital Premium" (Dual Theme)
- **Light Mode (defaut)**: Fond #F5F6F8, cartes blanches, ombres douces, texte noir #1A1D21
- **Dark Mode**: Fond #000, glass cards, grille clinique, texte blanc
- Violet (#7C5CFF) UNIQUEMENT pour contexte Care
- Logos: logo_white.png (contenu noir, pour light bg) / logo_black.png (contenu blanc, pour dark bg)

## Corrections appliquees
- Logo inverse (noir en light, blanc en dark)
- Texte lisible sur tous les boutons
- Carte Docteur Teleconsultation sur home beneficiaire
- SOS button avec icone et texte blanc sur fond rouge
- Avatar sombre avec initiale blanche
- Icones visibles en mode light
- Bordures subtiles (opacity faible)

## Composants crees
- `PageTitle.tsx` - Titre machine a ecrire avec caret
- `DoctorCard.tsx` - Carte teleconsultation premium
- `ClinicCard.tsx` - Carte HUD avec coins cliniques

## Features
- Dual Theme (Light + Dark)
- Onboarding 5 slides adaptatif
- 30+ pages theme-aware
- Push Notifications
- BLE Scale, Smart Alerts, Uber Tracking
- 6 roles utilisateur

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P0: Push TestFlight v2.0
- P1: Deploy backend permanent (HDS)
- P1: Lefu SDK natif
- P2: J-Style BLE
- P3: Shopify
- P4: Mode offline
