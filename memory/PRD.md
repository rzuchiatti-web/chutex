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

## Completed (Session 17 Mars 2026)

### Phase 1 - Bug Fix P0
- [x] Correction erreur "Rendered more hooks" sur program-detail.tsx
- [x] Ajout Loader standard sur pages Programme
- [x] Suppression fichier deprecie programs.tsx

### Phase 2 - Responsivite + Prefix + Equipe
- [x] Fix responsivite programme detail
- [x] PrefixPicker telephone invitation equipe
- [x] Simulation programme equipe (3 membres)
- [x] Section "Votre equipe" dans ProgramDailyView

### Phase 3 - REFONTE COMPLETE PROGRAMMES
- [x] **Backend: enrich_tasks_interactive()** - Auto-detection types interactifs (breathing, timer, counter, data_input, rating, action) a partir du texte des taches. Fonctionne pour les 5 programmes automatiquement.
- [x] **Backend: /api/programs/apply-onboarding** - Cree des rappels et objectifs a partir des reponses onboarding (heure coucher → rappel, heure reveil → rappel, baseline sante)
- [x] **Backend: /api/programs/team/leaderboard** - Classement equipe avec scores (checkins x10 + tasks x5 + streak x15)
- [x] **Frontend: BreathingTimer** - Exercice respiration plein ecran avec cercle anime, phases inspir/retenir/expir, compteur de cycles, barre de progression
- [x] **Frontend: CountdownTimer** - Chronometre avec play/pause, barre de progression, icone animee
- [x] **Frontend: RepCounter** - Compteur de repetitions avec cercle interactif et points de progression
- [x] **Frontend: RatingInput** - Evaluation par etoiles avec animation
- [x] **Frontend: ProgramDailyView refonte** - Header avec jour/streak/progression, Mission du jour, Actions interactives expandables, Tip du jour, Conseil Nora, Equipe, Classement, Check-in repositionne
- [x] **Onboarding connecte** - Les reponses onboarding creent des rappels dans l'app via apply-onboarding API
- [x] **Check-in repositionne** - Deplace SOUS les taches/equipe/leaderboard, affiche un resume et feedback
- [x] **Catalogue inline** - "Voir tous les programmes" toggle le catalogue sans navigation 404

## Backlog Prioritise
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
- `/app/frontend/src/components/ProgramDailyView.tsx` - Vue quotidienne programme interactive
- `/app/frontend/src/components/programs/BreathingTimer.tsx` - Timer de respiration anime
- `/app/frontend/app/(tabs)/chat.tsx` - Page programmes
- `/app/frontend/app/program-detail.tsx` - Detail et onboarding programme
- `/app/backend/routes/program_routes.py` - API programmes enrichie

## Test Credentials
| Role | Identifiant | Mot de passe |
|------|------------|--------------|
| Beneficiaire | 0651245918 | test123 |
| Gardien (Marie) | +33699887766 | test123 |

## Simulated Data
- Donnees sommeil: simulees dans MongoDB (7 jours)
- Programme equipe: Team C2CABC3A avec Josette, Marie Dupont, Pierre Martin
- Age biologique et glycemie: donnees mockees

## Notes Techniques
- Metro cache: `rm -rf /app/frontend/.metro-cache` puis `supervisorctl restart expo`
- Page Programmes = `(tabs)/chat.tsx`
- Login API utilise champ 'email' avec numero de telephone
- enrich_tasks_interactive() detecte automatiquement les types via regex sur le texte des taches
