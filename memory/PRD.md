# Chutex Care Watch - PRD

## Original Problem Statement
Refonte complete des tableaux de bord Beneficiaire et Gardien, des pages Sante, Programmes et Profil avec un design "clinique" et premium. Integration de la Balance & Gilet, signature electronique pour les documents admin, et integration du serveur TCP pour le bracelet V6 4G (J2358).

## Tech Stack
- Frontend: Expo React Native Web (file-based routing via expo-router)
- Backend: FastAPI + MongoDB
- AI: GPT-5.2 via Emergent LLM Key (LiteLLM)
- Charts: Custom SVG (no Recharts for RN Web compat)

## User Personas
- **Beneficiaire**: Personne agee portant le bracelet Elio, accede au tableau de bord sante
- **Gardien**: Famille/aidant qui surveille le beneficiaire a distance
- **Admin**: Gestion des utilisateurs, documents, paiements

## Core Features - DONE
- [x] Dashboard beneficiaire avec design clinique premium
- [x] Dashboard gardien coherent avec beneficiaire
- [x] Page Sante complete (sommeil, activite, signes vitaux, poids)
- [x] IA Nora pour analyses et rapports personnalises
- [x] Nora parle a la 3eme personne pour les gardiens
- [x] Systeme de rappels (CRUD temps reel)
- [x] Suppression bouton SMS de guardian-detail
- [x] Suppression carte correlation de sante
- [x] **Page Sommeil WHOOP** dans health-detail.tsx (Mars 2026):
  - Score performance sommeil (ring gauge SVG)
  - 4 sous-scores: Suffisance, Regularite, Efficacite, Stress
  - Hypnogramme des phases
  - Bilan dette sommeil (dynamique via backend)
  - Carte Recuperation (VFC, FC repos, zones)
  - Graphique 7 derniers jours (barres empilees)
  - Planification sommeil (besoin, coucher, reveil)
  - Risque d'apnee avec analyse Nora
  - Auto-selection derniere date avec donnees
  - Bug floating-point dette corrige
  - Endpoint backend /api/health/sleep/analysis

## Prioritized Backlog
### P1
- [ ] Integration Balance & Gilet connecte
- [ ] Systeme de Signature Electronique (Admin -> Documents)

### P2
- [ ] Systeme de parrainage Gardiens
- [ ] Flux essai gratuit 7 jours
- [ ] Integration test urinaire Vivoo

### BLOCKED
- [ ] Validation CRC32 serveur TCP J2358 (attente info fabricant)

## Key API Endpoints
- GET /api/health/sleep/analysis - Metriques WHOOP (performance, sufficiency, consistency, efficiency, sleep_stress, recovery, weekly_trend, sleep_need_min, recommended_bedtime)
- GET /api/health/sleep/history - Historique 7 jours
- GET /api/health/sleep - Donnees brutes
- GET /api/health/daily-report - Rapport quotidien IA
- GET /api/health/section-analysis/:section - Analyse IA par section

## Key Architecture
```
/app/frontend/app/health-detail.tsx - Page detail sante (sommeil WHOOP integre)
/app/backend/routes/health_sleep_routes.py - Endpoint analyse sommeil
/app/frontend/src/components/health/SleepCard.tsx - Widget sommeil dashboard
/app/frontend/src/components/health/SleepHypnogram.tsx - Graphique phases SVG
```

## Test Credentials
- Beneficiaire: 0651245918 / test123
- Gardien: +33612345678 / test123

## Important Technical Notes
- Metro est en mode CI: redemarrer expo + clear cache pour appliquer les changements
- Duration API retournee en heures (pas minutes) - conversion necessaire frontend
- AsyncStorage utilise localStorage sur web avec cle 'vl_token'
- apiFetch a un systeme de dedup et cache integre
