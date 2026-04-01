# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Nora IA — Actions via Chat
- [x] UPDATE_CALORIES, ADJUST_MACROS (bloques si objectif poids actif)
- [x] ADD_EXERCISE (toujours autorise)
- [x] DELETE_EXERCISE (Nora-assigned only, jamais prescriptions coach)
- [x] UPDATE_MEAL_PLAN (4 repas personnalises, allergies, conditions, budget cal)
- [x] Contexte enrichi : exercices du jour + nutrition du jour dans le prompt

### Morning Briefing Enrichi (REDESIGN COMPLETE)
- [x] Fond noir + video Nora animee (conserve)
- [x] Message Nora typewriter personnalise
- [x] Barre vitales (FC, SpO2, pas, sommeil)
- [x] 4 cartes animees : Sommeil, Exercices, Nutrition, Rappels
- [x] Programme actif + streak
- [x] Slider pour continuer (conserve)
- [x] Backend enrichi : exercices, nutrition, rappels, sleep dans /api/nora/morning-briefing

### Carte Sommeil — Popup Glass (COMPLETE)
- [x] Carte entiere cliquable (bouton "Modifier" supprime)
- [x] Glass popup : input heure reveil + heure coucher calculee
- [x] 4 facteurs scientifiques : qualite sommeil, stress, recuperation, activite physique
- [x] Indicateurs actifs/inactifs selon les donnees du bracelet
- [x] Explication algorithme credible (VFC, FC repos, stress, phases profondes)

### Exercices Beneficiaire
- [x] Auto-assignation, parametres editables, poids tracking, WorkoutPopup

### Dashboard Beneficiaire
- [x] Sommeil Whoop-style, programme, exercices, dispositifs, rappels

### Refactoring
- [x] pro-exercise-detail.tsx : 606 -> 403 lignes
- [x] BeneficiaryHome.tsx : 885 -> 707 lignes

## Backlog
- P1 : Deploiement TCP J2358
- P2 : Balance/gilet, Signature electronique, Parrainage, Essai 7j, Vivoo
