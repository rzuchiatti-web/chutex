# CARE WATCH - PRD

## Original Problem Statement
CARE WATCH — AI tele-assistance platform for elderly care with multi-role support.

## Architecture
- Frontend: Expo/React Native (Web + iOS)
- Backend: FastAPI + MongoDB
- AI: GPT-4.1-mini via Emergent LLM Key
- Integrations: Lefu Scale BLE, Expo EAS, ElevenLabs TTS

## Implemented (Session Feb 20, 2026)

### Page Santé — Coach Intelligent IA (COMPLETE)
- Backend `/api/health/daily-report` : **74 métriques** (bracelet + balance) avec analyse IA GPT-4.1-mini
- Score Vitalité /100 + statut du jour
- Synthèse IA personnalisée en langage humain (motivant, bienveillant)
- Corrélations IA entre données (sommeil↔stress, activité↔cardio, poids↔composition)
- Conseil prioritaire du jour + recommandations secondaires
- Indicateurs groupés par thème : Coeur, Corps, Sommeil, Activité, Stress
- Chaque carte = valeur + tendance + sparkline + phrase explicative
- CTA "Nouvelle pesée"
- Données : VO2max, HRV, glycémie, âge corporel, type corporel, ratio taille-hanche, apport calorique recommandé, données segmentaires (bras/jambes), etc.

### Dashboard Bénéficiaire (COMPLETE)
- Fond BG_DARK, cartes appareils avec images SVG + barres batterie gradient
- Section Rappels avec popup CRUD glass style
- Section Gardiens avec bouton blanc

## En Cours / Phase 2
- P0: Flow "Nouvelle pesée" multi-étapes en popup
- P0: Pages détail par indicateur (template cohérent)
- P1: Carte score santé sur le dashboard bénéficiaire
- P1: Données segmentaires (bras/jambes) dans la page santé
- P1: Type corporel avec grille visuelle
- P2: États UI (pas de données, sync, erreur...)
- P2: Deploy backend permanent

## Backlog
- BLE J-Style bracelet (P3)
- Shopify integration (P3)
- Offline mode intervenants (P4)

## Credentials
| Role | Email | Password |
|------|-------|----------|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
