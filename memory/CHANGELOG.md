# Chutex Care — Changelog

## 2026-03-17 — Code Audit & Cleanup

### Fichiers supprimes (dead code)
- `frontend/src/components/ClinicCard.tsx` — jamais importe
- `frontend/src/components/FloatingNav.tsx` — jamais importe
- `frontend/src/components/PageTitle.tsx` — jamais importe
- `frontend/src/components/dashboard/ActivitySleep.tsx` — jamais importe
- `frontend/src/components/Loader.tsx` — doublon de FullScreenLoader.tsx
- `backend/routes/health_routes.py` — fusionne dans health_report_routes.py
- `backend/tests/test_iteration*.py` x47 — vieux tests d'iterations
- `backend/tests/test_*` x17 — vieux tests eparpilles

### Fusion / Deduplication
- **Loader.tsx → FullScreenLoader.tsx** : 6 fichiers mis a jour (program-detail, subscription, index, chat, root index, morning-briefing)
- **health_routes.py → health_report_routes.py** : 8 endpoints migres (history, thresholds CRUD, sleep, sleep/history), import supprime de server.py

### Extraction de composants
- **WeightGoalDashCard** extrait de index.tsx → `src/components/dashboard/WeightGoalDashCard.tsx`

### Bilan
| Avant | Apres | Reduit |
|-------|-------|--------|
| 86 composants | 82 composants | -4 |
| 71 tests backend | 7 tests | -64 |
| health_routes + health_report_routes (2 fichiers) | 1 fichier fusionne | -1 |
| index.tsx 1122 lignes | 1072 lignes | -50 |

## 2026-03-17 — Performance Optimization
- API cache layer in api.ts (TTL 30-300s, dedup in-flight)
- Backend batch endpoint /api/dashboard/batch (8 queries en parallele)
- Polling reduit 60s

## 2026-03-17 — Join Team Code Feature
- Bouton + popup glass pour code equipe

## 2026-03-17 — Objective Cards Redesign + Sleep/Bio Age Fixes
- Grille 2x2, filtre stress, SleepCard border, Bio age pill styled

## 2026-03-17 — UI/UX Fixes Batch + Toast Fix
- Header teleconsult, NoraPill, Health no-data promo cards, Care card, Data seed, Toast fix

## 2026-03-17 — Previous Session
- Program detail redesign, Backend crash fix, Cover images, Toast structural fix
