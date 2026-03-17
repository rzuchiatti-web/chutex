# CHUTEX - Plateforme de Monitoring Sante

## Problem Statement
Application de monitoring sante style "Whoop" avec interface premium dark mode. Plateforme full-stack avec UI separees pour "Beneficiaires" et "Gardiens".

## Architecture
- **Frontend**: React (Expo Router v6) + TypeScript
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Integrations**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## Core Features Implemented
- Dashboard beneficiaire/gardien avec objectifs quotidiens
- Systeme d'alerte SOS + gardiens
- Suivi sante (sommeil, activite, poids, glycemie)
- Programmes de prevention personnalises (catalogue, detail, inscription)
- IA Nora (copilot sante)
- Rappels (hydratation, traitement, alarmes)
- Teleconsultation
- Objectif poids (minceur)
- Morning briefing quotidien
- Onboarding multi-etapes
- Sleep detail page avancee (hypnogramme V3, gauge radiale, bilan correle)

## Completed (Session Courante - 17 Mars 2026)
### Bug Fix P0 - Navigation Programme
- [x] Correction erreur "Rendered more hooks" sur program-detail.tsx
- [x] Ajout Loader standard sur pages Programme
- [x] Suppression fichier deprecie programs.tsx + nettoyage routes

### Ameliorations Programme - Responsivite, Prefix, Equipe
- [x] Fix responsivite: overflowX hidden, boxSizing, width 100% sur conteneurs
- [x] Ajout PrefixPicker (identique au login) sur le champ telephone d'invitation equipe
- [x] Correction inviteFriend() pour prepend prefix automatiquement
- [x] Simulation programme en equipe: 2 amis (Marie Dupont, Pierre Martin) ajoutes au team
- [x] Section "Votre equipe" dans ProgramDailyView avec:
  - Initiales avatar, statut check-in, nombre d'actions validees, indicateur humeur
  - Code equipe affiche
  - Badge "Vous" pour l'utilisateur courant
- [x] "Voir tous les programmes" corrige: toggle catalogue inline au lieu de /programs (404)
- [x] Bouton "Retour au programme actif" dans la vue catalogue

## Backlog Prioritise
### P0 (Critique)
- (Aucun bug critique en cours)

### P1 (Important)
- Estimation ML de la glycemie (V3)

### P2 (Futur)
- Systeme de parrainage Gardien
- Essai gratuit 7 jours
- Visualisation PDF du contrat
- Integration test urinaire Vivoo
- Correlations sante (UI)
- Documentation technique algo glucose (brevet)
- Refactoring WhoopTabBar.tsx

## Key Files
- `/app/frontend/app/(tabs)/chat.tsx` - Liste des programmes + catalogue toggle
- `/app/frontend/app/program-detail.tsx` - Detail programme avec PrefixPicker
- `/app/frontend/app/(tabs)/index.tsx` - Dashboard beneficiaire
- `/app/frontend/app/health-detail/[metric].tsx` - Detail sante/sommeil
- `/app/frontend/src/components/ProgramDailyView.tsx` - Vue quotidienne programme + section equipe
- `/app/frontend/src/components/Loader.tsx` - Composant loader standard
- `/app/backend/routes/program_routes.py` - API programmes + equipes

## Test Credentials
| Role | Identifiant | Mot de passe |
|------|------------|--------------|
| Beneficiaire | 0651245918 | test123 |
| Gardien (Marie) | +33699887766 | test123 |

## Simulated Data
- Donnees sommeil: simulees dans MongoDB (7 jours)
- Programme equipe: Team C2CABC3A avec Josette (user), Marie Dupont (checked in), Pierre Martin (en attente)
- Age biologique et glycemie: donnees mockees

## Notes Techniques
- Le Metro bundler cache agressivement: `rm -rf /app/frontend/.metro-cache` puis `supervisorctl restart expo`
- La page Programmes est `(tabs)/chat.tsx`, PAS `programs.tsx` (supprime)
- Login API utilise le champ 'email' avec le numero de telephone
