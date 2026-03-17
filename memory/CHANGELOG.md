# Chutex Care — Changelog

## 2026-03-17 — Join Team Code Feature

### Completed
1. **Bouton "Rejoindre une equipe"** — Bouton avec icone equipe (ri-team-line) en haut a droite de la page Programmes, a cote du bouton guide (?). Visible uniquement quand il n'y a pas de programme actif.
2. **Popup glass "Code equipe"** — Popup glassmorphism (backdrop-filter blur(32px)) avec champ de saisie code equipe (auto-uppercase, monospace, lettre espacement). Gestion d'erreur + succes + loading state. Appel backend `POST /api/programs/team/join`.
3. **Backend existant** — L'endpoint `/api/programs/team/join` etait deja en place. Valide le code, verifie les limites d'equipe (5 max), et demarre le programme pour le nouvel utilisateur.

### Files Modified
- `frontend/app/(tabs)/chat.tsx` — Ajout du bouton join-team-btn + popup join-team-popup + handler handleJoinTeam

## 2026-03-17 — Objective Cards Redesign + Sleep/Bio Age Fixes

### Completed
1. **Objectifs journaliers refonte** — Grille 2x2, filtre stress/respiration, 4 cartes uniquement
2. **Carte sommeil bordure + ombre** — Border+shadow sur SleepCard avec donnees
3. **Pillule age biologique** — Card wrapper supprime, pill seule stylee

## 2026-03-17 — UI/UX Fixes Batch + Toast Fix

### Completed
1. Header teleconsult supprime
2. NoraPill border + shadow
3. Health no-data: AnimatedDarkBg + cartes promotionnelles devices
4. Care subscription card border + shadow
5. Health data re-seeded (14 jours)
6. Social notification toast corrige (z-index max)

## 2026-03-17 — Previous Session
- Program detail page redesign
- Backend bug fix: /api/programs/active
- Program cover images
- Toast structural fix
