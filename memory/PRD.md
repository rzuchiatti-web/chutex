# Chutex Care - Product Requirements Document

## Original Problem Statement
Build "Chutex Care," a preventative health application for elderly care with connected devices, AI-powered health monitoring, teleassistance, and care agency integration.

## Core Architecture
- **Frontend**: React (Expo Router) - Web + iOS
- **Backend**: FastAPI + MongoDB (vitallink_db)
- **3rd Party**: VAPI.ai (voice), Stripe (payments), OpenAI GPT-5.2 (AI), Mailjet (email), SMSMode (SMS), Lefu (scale API), ElevenLabs (TTS)

## What's Been Implemented

### Dorsi Smart Cushion - Complete
- Shared BLE context (DorsiBLEContext) — persistent across pages
- acceptAllDevices BLE scanning, real BLE measurements in bilan
- 15 mini-games with cartoon visuals, animated backgrounds
- Game logic fixes: serpent game-over on self-bite, course/gravite game-over on collision
- Dorsi Index (0-100) merged with Bilan CTA + info popups
- Streaks calendar (14 days), score history visible
- Carousel swipable for free games with best scores
- HUD: record comparison in real-time, "NOUVEAU RECORD!" indicator
- Score history on game launch screen
- Programme adaptatif IA (GPT-5.2)

### i18n - 7 Languages, VAPI Voice AI, Previous features
- All implemented and working

### Poids & Nutrition (Weight & Nutrition) - Complete (March 2026)
- **Backend**: New endpoint `GET /api/minceur/weight-details` — fetches user profile, weight history from scale, calculates IMC/BMR/TDEE, body composition, generates daily AI recommendations (meals + exercises) via GPT-5.2 with daily caching
- **Backend**: `POST /api/minceur/weight-goal` — optional weight goal setter, invalidates cache
- **Backend**: `DELETE /api/minceur/weight-goal` — remove goal
- **Backend**: `POST /api/minceur/refresh-recommendations` — force refresh
- **Frontend**: Complete rewrite of `/minceur.tsx` as permanent health dashboard:
  - Weight Hero Card: current weight, BMI with color-coded gauge, weight evolution SVG chart
  - **Tabbed Charts**: 3 onglets Poids/Graisse/Muscle — chaque indicateur a son propre graphique SVG animé avec couleurs distinctes (ambre/orange/vert)
  - Body Composition: animated ring charts (fat%, muscle%, hydration%, visceral fat) + bone mass, body age, protein
  - Optional Goal Setter: +/- weight target with week duration selector
  - AI Recommendations: Nora insight, daily calorie budget with macros, water intake
  - Meals Tab: 4 detailed meal cards with ingredients, portions, calories, timing
  - Exercises Tab: home exercises adapted for seniors with duration, intensity, calories
  - Tip of the Day
  - Premium clinical UI with animations, glass morphism
- **Health Tab Card**: Mini-tabs Poids/Graisse/Muscle avec mini sparkline bars qui changent selon l'onglet sélectionné
- **Testing**: 100% pass (iteration_93 backend 19/19 + iteration_94 frontend 100%)

### Suivi Quotidien (Daily Tracking) - Complete (March 2026)
- **Backend**: `POST /api/minceur/track` — toggle repas/exercice comme fait/non-fait pour aujourd'hui. `GET /api/minceur/today-tracking` — statut du jour + streak + adherence hebdo. Tracking intégré dans la réponse weight-details.
- **Frontend**: Boutons de validation (check) sur chaque carte repas et exercice. Barre de progression "Suivi du jour" (ex: 4/6) avec badge streak en feu. Items validés: opacité réduite, texte barré, check vert. Toggle instantané (optimistic UI). Persistance MongoDB.
- **Testing**: 100% pass (iteration_95 backend 15/15 + frontend 100%)

### Allergies & Page Detail Repas - Complete (March 2026)
- **Backend**: Allergies du profil intégrées dans le prompt GPT (INTERDICTION ABSOLUE des allergènes). Conditions médicales aussi prises en compte. Données repas enrichies: ingrédients avec quantités/calories, étapes de recette, macros par repas (protéines, glucides, lipides), temps de préparation.
- **Frontend - Page detail repas** (`meal-detail.tsx`): Page dédiée cliquable depuis chaque carte repas. Affiche: hero avec nom/type/heure, valeurs nutritionnelles (calories + macros), liste d'ingrédients avec quantités et calories unitaires, étapes de préparation numérotées, bouton de validation.
- **Frontend - Rappel allergies**: Bandeau "Complétez vos allergies" si non renseignées, redirige vers le profil.
- **Testing**: 100% pass (iteration_96 backend 13/13 + frontend 100%)

### Refonte UI Poids & Nutrition - Complete (March 2026)
- Carte unique fusionnée: Poids + IMC avec jauge + onglets graphiques (Poids/Graisse/Muscle) + objectif intégré. Plus de MB/DET confus.
- Supprimé: section composition corporelle séparée, bandeau allergies permanent, conseil du jour séparé
- Suivi quotidien: déplacé en pill compact dans le header (streak + compteur)
- Analyse Nora: fusionnée avec le conseil en une seule carte
- Note allergies: discrète en bas de la page détail repas uniquement
- Carte santé simplifiée: 3 valeurs claires (Poids/Graisse/Muscle) sans graphiques
- **Testing**: 100% pass (iteration_97 frontend 100%)

### Interprétation Métriques & Graphiques Pleine Largeur - Complete (March 2026)
- Graphiques SVG prennent toute la largeur de la carte (edge-to-edge)
- MetricInsight animé sous le graphique : badge contextuel (Normal/Excellent/Faible/Elevé) + plage de référence + explication en langage clair
- Interprétation adaptée au genre (plages différentes homme/femme)
- Animation fadeSlideIn au changement d'onglet

### Nora en bas, Sync tracking, Page exercice - Complete (March 2026)
- Analyse Nora déplacée en bas de page (après repas/exercices)
- Bug fix: synchronisation tracking corrigée
- Page détail exercice (`exercise-detail.tsx`)
- **Testing**: 100% pass (iteration_98)

### UI/UX Fixes - March 2026 (Latest)
- **Streak popup**: Réécriture complète en popup glassmorphism plein écran (style page profil) avec bouton X, compteur streak, compteur progression, liste détaillée des repas/exercices du jour avec statut
- **Carte objectif indépendante**: Séparée de la carte poids. Affiche "79.2 → 70 kg" avec flèche, barre de progression, stats (kcal/jour, repas/jour, exercices)
- **Images cartes repas**: Remplissent toute la hauteur de la carte (position absolute, inset 0, objectFit cover) — plus d'espace blanc en bas quand le titre est sur 3 lignes
- **Pages détail (repas/exercice)**: Corrigé l'overlap — carte sous l'image hero ne cache plus le titre (marginTop: 12px au lieu de -30px)
- **Onglets graphiques**: Style plus subtil, contenus dans la carte (pas de débordement)
- **Testing**: 100% pass (iteration_99 frontend 100%)

### Bug Fix: Mot de passe persistant - March 2026
- **Problème**: Le mot de passe changé par l'utilisateur se réinitialisait entre les sessions (snapshots DB)
- **Solution**: Système de persistance fichier (`password_overrides.json`). Quand un utilisateur change son mot de passe:
  1. Le hash est sauvegardé dans MongoDB (comportement normal)
  2. Le hash est AUSSI sauvegardé dans `/app/backend/password_overrides.json` (persiste entre forks)
  3. Au démarrage du serveur, les overrides sont appliqués automatiquement à la DB
- **Endpoints impactés**: `PUT /api/auth/change-password`, `POST /api/auth/reset-password`
- **Testing**: Vérifié — changement de mot de passe persiste après reset DB + restart serveur

### Swipe Picker Objectif + Bilan Hebdo Nora - March 2026
- **SwipePicker**: Composant de sélection par glissement horizontal pour le poids cible (entiers) et la durée du programme (semaines). Remplace les boutons +/- et les pills. Animation snap-to, indicateur central, fade edges, support tactile/souris.
- **Bilan Hebdomadaire Nora**: Nouvelle carte en bas de page minceur avec:
  - Stats hebdomadaires: repas validés, exercices validés, jours actifs
  - Message IA personnalisé de Nora (GPT-5.2) avec bilan et conseil pour la semaine prochaine
  - Endpoint: `GET /api/nora/weekly-report`
- **Testing**: 100% pass (iteration_100 backend 6/6 + frontend 100%)

## Prioritized Backlog
### P0
- Weekly Nora Report (push notification/summary)

### P1
- Guardian referral system, Free 7-day trial

### P2
- Correlations sante (infrastructure ready), Contract PDF, Vivoo, Build natif iOS

### Known Items for Future Polish
- Visuals for preparation steps in meal detail
- Swipe animation for goal setter
