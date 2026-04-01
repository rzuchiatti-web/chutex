# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB
- Auth: JWT (clé `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalités Implémentées

### Exercices Bénéficiaire
- [x] Auto-assignation depuis bibliothèque + création personnalisée
- [x] Modifier séries/reps/repos (bouton crayon toggle)
- [x] Poids (kg) persistant + graphe SVG évolution
- [x] Popup workout plein écran (séries + timer repos + son/vibration + validation intégrée)
- [x] Light/Dark mode adaptatif, boutons ronds, responsive 480px
- [x] Validation uniquement après complétion exercice
- [x] Images cohérentes (backend merge template data)

### Dashboard Bénéficiaire
- [x] Carte Sommeil "Whoop-style" (coucher recommandé calculé dynamiquement + alarme réveil)
- [x] Carte programme, exercices (compteur X/Y, barre douleur progressive)
- [x] Dispositifs en cartes séparées, couleurs uniformes #F4F4F5
- [x] Teleconsultation → page dédiée /teleconsult-doctor
- [x] Nora dans navbar, Messages light mode
- [x] Navigation navbar corrigée (pages hors-tabs)

### Pages Détaillées
- [x] IMC : header avec valeur, jauge, sparkline enrichi, section "Comprendre" complète
- [x] Repas : titre centré, images par type, bouton valider en bas, header sans icône
- [x] Exercices : titre centré, minHeight pleine page
- [x] Boutons retour ronds (borderRadius: 999) partout
- [x] Calendrier dynamique sur toutes les pages (activity, health, metric, glycemia)

### Bug Fixes
- [x] Programme Solo sans équipe ni notifications
- [x] TeamActivityToast skip pour solo
- [x] Image exercice préservée après update-params (merge template)
- [x] Navigation navbar depuis pages hors-tabs

## Tâche Prioritaire Suivante

### P0 : Nora IA — Gestion exercices et nutrition (function calling)
**Règles métier :**
- **Calories/Macros** : Nora ne peut ajuster QUE si AUCUN objectif de poids en cours. Si objectif actif → "Terminez votre objectif de poids d'abord"
- **Exercices** : Nora peut TOUJOURS ajouter des exercices (dans les 2 cas)
  - Si gardien/coach a prescrit → Nora ajoute EN PLUS, ne supprime JAMAIS les prescriptions
  - Si aucune prescription → Nora crée librement depuis la bibliothèque
- **Sécurité** : Plafond 2h exercice/jour seniors, ajustements progressifs

**Implementation :**
- Function calls GPT-5.2 : assign_exercise, update_calories, adjust_macros, update_meal_plan
- Via chat existant /chat-ia (Nora)

## APIs Clés
- `GET/PUT /api/health/sleep-alarm` — Alarme réveil + coucher recommandé
- `GET /api/pro/beneficiary-today-exercises?date=` — Exercices du jour (merge template)
- `PUT /api/pro/assigned-exercises/{id}/update-params` — Modifier séries/reps/repos
- `PUT /api/pro/assigned-exercises/{id}/save-weight` — Enregistrer poids
- `POST /api/pro/self-assign-exercise` — Auto-assignation (supporte __custom__)

## Backlog
- P1 : Déploiement TCP J2358
- P2 : Balance/gilet connectés, Signature électronique, Parrainage, Essai 7j, Vivoo
