# Chutex Care - PRD

## Build 120+ (2026-04-05) — Corrections massives post-retour utilisateur

### Corrections cette session (2026-04-05):

**Sommeil — Coherence des donnees:**
- Daily-report utilisait des valeurs corrompues du device doc (deep=180, light=890, rem=268 = 1338min)
- Fix: Cap a 720min max pour les phases. Fallback vers les readings reelles (cmd=0x53) si le device doc est corrompu
- SleepCard utilise desormais la somme des phases (deep+light+rem) au lieu de sleep_duration_min brut
- Resultat: Carte et page detail affichent tous les deux ~9h41

**Sommeil — Hypnogramme correct:**
- Le SleepHypnogram utilisait INTERVAL=5 (5min par stage) pour des stages minute-par-minute (581 stages)
- Fix: INTERVAL dynamique (1 si >200 stages, 5 sinon)
- Resultat: Les heures de coucher/lever sont maintenant correctes (4h20 -> 14:02)

**Sommeil — Risque d'apnee recalibre:**
- Ancienne formule: inter * 12 + (quality < 70 ? 20 : 0) = 92% pour 6 interruptions
- Nouvelle formule: inter * 5 + (quality < 70 ? 15 : 0) + (quality < 50 ? 10 : 0) = 45%
- Plus realiste cliniquement

**Sommeil — Carte Regularite restauree:**
- SleepRegularityCard etait importee mais jamais rendue dans health-detail.tsx
- Fix: Ajoutee au rendu de la page sommeil (visible avec >= 2 nuits de donnees)

**UI — Padding 70px:**
- Popup ajout exercice (activity-detail): padding 40px -> 70px
- Popup info sommeil (health-detail): padding 50px -> 70px

**Bibliotheque exercices:**
- La popup fonctionne correctement mais est vide car aucun modele de coach n'existe
- Ce n'est pas un bug, c'est un etat attendu

## Architecture
- Frontend: React Native _layout.tsx + WebView. BLE bridge: bleV8Bridge.ts
- Backend: FastAPI. Routes: health_report_routes.py, health_sleep_routes.py
- DB: MongoDB (vitallink_db)

## Upcoming Tasks
- P1: Configuration WiFi balance Lefu
- P1: Verifier retours Build 120 (push notifications, gilet BLE, pas historiques)
- P2: Deploiement production serveur TCP J2358
- P2: Integration gilet connecte (data monitoring complet)
- P2: Signature Electronique, Parrainage, Essai 7j, Vivoo
