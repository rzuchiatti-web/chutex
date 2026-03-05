# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS, Lefu Cloud API, Web Bluetooth

## Test Credentials
| Role | Phone/Email | Password |
|------|-------------|----------|
| Beneficiary | 0651245918 | test123 |
| Guardian #1 | 0612345678 | test123 |

## Completed This Session

### Age Corporel Nora AI + Carte Activite + Streak
- Age corporel par Nora (GPT-5.2) base sur toutes les donnees depuis inscription, 7 jours minimum
- Carte activite pleine largeur (pas/kcal/km) + barre recuperation + note Nora
- Streak objectifs reels avec badges

### Objectifs Journaliers Coherents
- daily_plan = morning_briefing (meme source)
- Objectifs actionnables: calories a manger, eau, pas, coucher, relaxation
- Plus d'objectifs long terme (graisse viscerale etc.)

### Refonte Programmes (EN COURS - bugs a corriger)
- 10 programmes avec 573/575 taches ayant des guided_steps generes par GPT
- Personnalisation dynamique par Nora selon profil utilisateur (age, pathologies)
- Popup glass plein ecran pour les exercices avec etapes
- Boutons de choix au lieu de textarea
- Conditions appareils (bracelet/balance requis)
- Auto-save task progress via indices
- Page programmes unifiee (onglet DNA = chat.tsx)

## BUGS A CORRIGER (PRIORITE P0)
1. **Etapes guidees ne s'affichent pas pour taches 0 et 1** - Les guided_steps existent en base (573/575) mais ne sont pas transmises au frontend apres personnalisation Nora. Le code `original_guided_steps = today_tasks.get("guided_steps", {})` recupere les steps AVANT personnalisation mais les steps sont indexes par jour, pas par tache. Verifier que `guided_steps` est un dict {"0": [...], "1": [...], "2": [...]} et pas une liste.
2. **Taches validees ne persistent pas** - Systeme d'indices (tasks_done_indices) implemente mais pas teste end-to-end. Le frontend envoie task_index au backend mais le chargement initial doit verifier tasks_done_indices.
3. **Actions deja faites** - Popup "Action realisee + Recommencer" implemente mais depend du fix #2

## Fichiers Cles Programmes
- `frontend/src/components/ProgramDailyView.tsx` - Vue quotidienne + popup exercices
- `frontend/app/(tabs)/chat.tsx` - Page programmes (onglet)
- `frontend/app/programs.tsx` - Catalogue tous programmes
- `frontend/app/program-detail.tsx` - Fiche detail programme
- `backend/routes/program_routes.py` - Tous les endpoints programmes
- `backend/generate_guides.py` - Script generation guided_steps

## Endpoints Programmes
- GET /api/programs/active - Programme actif avec today_tasks + task_progress
- POST /api/programs/save-task - Auto-save tache individuelle {task_index, rating, notes}
- POST /api/programs/checkin - Check-in quotidien {mood, tasks_done_indices}
- GET /api/programs/catalog - Liste programmes
- POST /api/programs/start - Demarrer programme
- POST /api/programs/stop - Arreter programme

## Collections MongoDB Programmes
- programs: 10 programmes avec daily_tasks_template + guided_steps
- program_enrollments: inscriptions utilisateurs
- program_checkins: check-ins quotidiens
- program_task_progress: progression taches auto-savees (tasks_done_indices)
- personalized_tasks_cache: cache personnalisation Nora par jour

## Future/Backlog
- Systeme parrainage gardien
- Essai gratuit 7 jours
- Contrat PDF
- Deploiement production
