# CHUTEX - Plateforme de Monitoring Sante

## Problem Statement
Application de monitoring sante style "Whoop" avec interface premium dark mode. Plateforme full-stack avec UI separees pour "Beneficiaires" et "Gardiens".

## Architecture
- **Frontend**: React (Expo Router v6) + TypeScript
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Integrations**: Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## Completed (Session 17 Mars 2026)

### Phase 1 - Bug Fix P0
- [x] Correction erreur "Rendered more hooks" sur program-detail.tsx
- [x] Ajout Loader standard sur pages Programme
- [x] Suppression fichier deprecie programs.tsx

### Phase 2 - Responsivite + Prefix + Equipe
- [x] Fix responsivite programme detail
- [x] PrefixPicker telephone invitation equipe
- [x] Simulation programme equipe (3 membres)

### Phase 3 - Refonte Complete Programmes
- [x] Backend: enrich_tasks_interactive() auto-detection types interactifs
- [x] Backend: /api/programs/apply-onboarding cree rappels/objectifs
- [x] Backend: /api/programs/team/leaderboard classement equipe
- [x] Frontend: BreathingTimer, CountdownTimer, RepCounter, RatingInput
- [x] Frontend: ProgramDailyView refonte complete
- [x] Check-in repositionne sous les taches

### Phase 4 - Coherence Dashboard + Taches In-App
- [x] **Carte programme dashboard refonde**: Gradient, icone animee, dots progression, streak badge, pill "Continuer/Bilan fait"
- [x] **Bouton gardien fixe**: Bordure violette visible (rgba(167,139,250,0.15)), fond teinte
- [x] **transform_task_text()**: Transformation automatique de TOUTES les taches pour referencer l'app

### Phase 5 - Notification Sociale + Refonte Visuelle Programme (Session 2)
- [x] **Toast notification social**: TeamActivityToast.tsx refait avec ReactDOM.createPortal, monte dans _layout.tsx via TeamActivityOverlay
- [x] **Backend team feed**: /api/programs/team/feed operationnel + donnees simulees (Marie Dupont, Lucas Bernard)
- [x] **Fix KeyError started_at**: Fallback started_at/start_date dans get_active_program
- [x] **Refonte program-detail.tsx**: Hero image 420px avec cover_image Unsplash, gradient subtil, pills, stats, science box, benefits, metrics, phases
- [x] **Cover images**: 10 programmes avec images Unsplash (sommeil, tension, activite, nutrition, equilibre, mental, memoire, cardio, posture, respiration)
- [x] **Catalog updated**: chat.tsx utilise p.cover_image || PROG_IMAGES fallback:
  - "papier/carnet" → "dans l'app (onglet Sante)"
  - "programmez un rappel" → "activez rappel dans l'app (onglet Rappels)"
  - "notez l'heure" → "enregistrez dans l'app"
  - "alarme telephone" → "rappel dans l'app"
  - "apps de meditation/flashcards" → "exercices integres dans l'app"
  - Fonctionne pour les 5 programmes automatiquement

## Backlog Prioritise
### P1 - Estimation ML de la glycemie (V3)
### P2 - Parrainage Gardien, Essai 7 jours, PDF contrat, Vivoo, Correlations sante, Brevet glucose
### P3 - Refactoring WhoopTabBar.tsx (generique)

## Key Files
- `/app/frontend/src/components/programs/TeamActivityToast.tsx` - Toast notification social (Portal)
- `/app/frontend/app/program-detail.tsx` - Detail programme avec hero image
- `/app/frontend/src/components/ProgramDailyView.tsx` - Vue quotidienne interactive
- `/app/frontend/src/components/programs/BreathingTimer.tsx` - Timer respiration
- `/app/frontend/app/(tabs)/index.tsx` - Dashboard avec carte programme
- `/app/frontend/app/(tabs)/chat.tsx` - Page programmes avec catalog
- `/app/frontend/app/_layout.tsx` - Layout racine avec TeamActivityOverlay
- `/app/backend/routes/program_routes.py` - API programmes + team feed + transform_task_text

## Test Credentials
| Beneficiaire | 0651245918 | test123 |
| Gardien | +33699887766 | test123 |
