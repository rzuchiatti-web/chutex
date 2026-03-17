# Chutex Care — Changelog

## 2026-03-17 — Objective Cards Redesign + Sleep/Bio Age Fixes

### Completed
1. **Objectifs journaliers refonte** — Suppression de l'objectif "10 min respiration" (filtre `stress`). Cartes redesignees en grille 2x2 avec layout plus compact : icone centree, label en haut, valeur centree, couleurs d'accent par type (vert/pas, jaune/calories, cyan/hydratation, violet/sommeil).
2. **Carte sommeil bordure + ombre** — Ajout de border (1.5px solid rgba(255,255,255,0.25)) et box-shadow violet au SleepCard quand il affiche des donnees reelles.
3. **Pillule age biologique** — Suppression du conteneur carte autour de l'age biologique. Border + ombre ajoutes uniquement a la pillule noire avec video Nora (data-testid='bio-age-pill').

### Files Modified
- `frontend/app/(tabs)/index.tsx` — Grille 2x2, filtre stress, refonte des cartes
- `frontend/src/components/health/SleepCard.tsx` — Border+shadow sur variante avec donnees
- `frontend/src/components/health/HeroScore.tsx` — Card wrapper supprime, pill stylee

## 2026-03-17 — UI/UX Fixes Batch + Toast Fix

### Completed
1. **Header teleconsult supprime** — Header fixe retire de la page teleconsultation QCM
2. **NoraPill border + shadow** — Border et box-shadow visibles sur la pilule Nora du dashboard
3. **Bio age card** — (superseded by later change - pill only now)
4. **Health no-data unified background** — AnimatedDarkBg + cartes promotionnelles Bracelet Elio/Balance Vita
5. **Care subscription card border + shadow** — Border et box-shadow sur la carte abonnement Care
6. **Health data re-seeded** — 14 jours de donnees bracelet + balance
7. **Social notification toast fixed** — z-index maximum, toast fonctionnel

## 2026-03-17 — Previous Session (Program & Toast Work)
- Program detail page complete redesign
- Backend bug fix: KeyError 'started_at' in /api/programs/active
- Program cover images added
- Toast notification structural fix
- Team activity seed data created
