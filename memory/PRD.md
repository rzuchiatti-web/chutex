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
- [x] ADD_EXERCISE, DELETE_EXERCISE (Nora-assigned only)
- [x] UPDATE_MEAL_PLAN (4 repas personnalises)
- [x] Contexte enrichi : exercices du jour + nutrition dans le prompt

### Morning Briefing Enrichi
- [x] Redesign complet : fond noir, video Nora, animations
- [x] 4 cartes : Sommeil, Exercices (X/Y), Nutrition (kcal), Rappels
- [x] Barre vitales + programme actif + streak

### Carte Sommeil — Popup Glass
- [x] Carte cliquable -> popup glass avec facteurs scientifiques
- [x] Input reveil + coucher calcule + explication VFC/stress/recuperation

### Notification Push Coucher
- [x] Background task (60s loop) verifie les alarmes actives
- [x] Notification 15 min avant le coucher recommande
- [x] Message fixe : "Coucher recommande a XX:XX pour Xh de sommeil reparateur"
- [x] Seulement si alarme activee, 1 notif/jour max (collection bedtime_notifications)
- [x] Calcul local (pas de LLM) avec ajustements sante

### Exercices, Dashboard, Refactoring
- [x] Tous les features precedents conserves et fonctionnels

## Backlog
- P1 : Deploiement TCP J2358
- P2 : Balance/gilet, Signature electronique, Parrainage, Essai 7j, Vivoo
