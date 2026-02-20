# CARE WATCH — PRD

## Application
Plateforme de tele-assistance IA pour le suivi sante des personnes agees.

## Architecture
- Frontend: Expo/React Native (Web + iOS)
- Backend: FastAPI + MongoDB
- AI: GPT-4.1-mini via Emergent LLM Key (74 metriques)
- Devices: Bracelet Elio + Balance Vita (simules)

## Session Feb 20, 2026 — Complete

### Pages Auth
- **Connexion** : fond BG_DARK glass, champs glass, bouton pill
- **Inscription** : 2 parcours (Beneficiaire 4 etapes + Gardien 3 etapes), dossier medical complet

### Dashboard Beneficiaire
- Fond BG_DARK, cartes appareils SVG + batterie gradient
- Section Rappels (3 types, popup CRUD glass)
- Section Gardiens + bouton blanc

### Page Sante — Coach IA Intelligent
- Bloc analyse 7 jours (onboarding)
- Score IA /100 + sous-scores (Cardio, Sommeil, Activite, Metabolisme, Hydratation)
- Objectifs journaliers (4 metriques IA)
- Carte sommeil hypnogramme + mouvements + apnee
- 4 sections sante (Cardiaque, Metabolique, Physique, Composition)
- Correlations IA "Comprendre mon corps"
- Dernieres pesees
- CTA flottant "Nouvelle pesee" (4 etapes)

### Pages Detail
- 6 pages thematiques avec analyse IA
- Page metric-detail avec 8 types graphiques sur-mesure + calendrier
- Page rapport pesee (30+ donnees balance)

## Tests : 100% Backend (16/16) + 100% Frontend
