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
- [x] **Bug Fix P0**: Correction erreur "Rendered more hooks" sur program-detail.tsx (useState declare apres retours conditionnels)
- [x] **Loader standard**: Ajout animation de chargement coherente sur pages Programmes et Detail Programme
- [x] **Cleanup**: Suppression fichier deprecie programs.tsx + nettoyage routes _layout.tsx
- [x] **Fix routing**: router.replace('/programs') → router.replace('/(tabs)/chat') dans program-detail.tsx

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
- `/app/frontend/app/(tabs)/chat.tsx` - Liste des programmes
- `/app/frontend/app/program-detail.tsx` - Detail programme
- `/app/frontend/app/(tabs)/index.tsx` - Dashboard beneficiaire
- `/app/frontend/app/health-detail/[metric].tsx` - Detail sante/sommeil
- `/app/frontend/src/components/Loader.tsx` - Composant loader standard
- `/app/backend/main.py` - API backend

## Test Credentials
| Role | Identifiant | Mot de passe |
|------|------------|--------------|
| Beneficiaire | 0651245918 | test123 |
| Gardien (Marie) | +33699887766 | test123 |

## Notes Techniques
- Le Metro bundler cache agressivement — nettoyer avec `rm -rf /app/frontend/.metro-cache` puis `supervisorctl restart expo`
- Les donnees sommeil sont simulees dans MongoDB
- La page Programmes est `(tabs)/chat.tsx`, PAS `programs.tsx` (supprime)
