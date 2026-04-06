# Chutex Care - PRD

## Build 120+ (2026-04-06) — Corrections massives + bibliothèque exercices

### Corrections session 2 (2026-04-06):

**Bibliotheque exercices pour beneficiaire:**
- Endpoint `/api/pro/exercise-library` retourne maintenant TOUS les templates (40) pas seulement ceux du coach lie
- Meme logique que les suggestions de rappels: templates pro en priorite, puis bibliotheque globale
- Categories disponibles: force, cardio, mobilite, souplesse

**Bouton Synchroniser bracelet:**
- Bouton "Synchroniser" ajoute sur la carte Elio dans la page Dispositifs
- Declenche le scan BLE pour synchronisation manuelle des donnees

### Corrections session 1 (2026-04-05):

**Sommeil — Coherence des donnees:**
- Daily-report ignorait des valeurs corrompues du device doc (1338min > 720min cap)
- Fallback vers readings reelles (cmd=0x53) si device doc corrompu
- SleepCard utilise somme des phases (deep+light+rem) au lieu de sleep_duration_min brut
- Resultat: Carte et page detail affichent tous les deux ~9h41

**Sommeil — Hypnogramme correct:**
- INTERVAL dynamique (1 si >200 stages, 5 sinon) pour stages minute-par-minute

**Sommeil — Risque d'apnee recalibre:**
- Formule: inter * 5 + (quality < 70 ? 15 : 0) + (quality < 50 ? 10 : 0)
- 6 interruptions + qualite 64% = 45% (Modere) au lieu de 92%

**Sommeil — Carte Regularite restauree:**
- SleepRegularityCard rendue dans health-detail.tsx (visible avec >= 2 nuits)

**UI — Padding 70px:**
- Popup ajout exercice (activity-detail): 40px -> 70px
- Popup info sommeil (health-detail): 50px -> 70px

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
