# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Architecture
- Frontend: React Native (Expo) avec Expo Router, web + iOS
- Backend: FastAPI + MongoDB
- Integrations: Stripe, Shopify, Mailjet, OpenAI GPT-5.2 (Nora IA), SMS Mode, Expo EAS

## Test Credentials
| Role | Phone/Email | Password |
|------|-------------|----------|
| (Aucun compte - base videe le 2 mars 2026) | | |
| Codes activation: PRESC-DOC-01, PRESC-INF-01, PRESC-SAAD-01 | | |
| Codes intervention: CARE-STETI-01, CARE-PARIS-01, CARE-LYON-01 | | |

## Completed Features

### Mar 2, 2026 - BLE Gilet + Bracelet + Suppression Simulation
- Gilet: parsing protocole texte S-AIRBAG (@&type=1&bat=28&...#), batterie, detection chute (type=2&sos=1) -> alerte + escalade gardiens
- Bracelet: fix batterie (setBleVitals dynamique quand cmd 0x0D arrive)
- Suppression TOTALE simulation: health_routes.py (historique), health_report_routes.py (rapport PDF), caches vides
- 24.7C = donnee REELLE bracelet (temp ambiante, pas portee)

### Mar 2, 2026 - Fix Switch Beneficiaire/Gardien
- Corrige le switch de role sur la page profil (catch {} silencieux remplace par verification has_guardian_space + popup activation)
- Import GuardianActivationPopup dans profile.tsx
- Bug fix: KeyError water_pct dans health_report_routes.py (ligne 108)

### Mar 2, 2026 - Nettoyage complet base de donnees
- Toutes les collections videes (users, devices, subscriptions, contracts, readings, etc.)
- Seuls les programmes (10), codes activation (3) et codes intervention (3) recrees
- Bug fix: KeyError water_pct dans health_report_routes.py (ligne 108) - utilisait d["water_pct"] au lieu de g("water_pct")

### Mar 2, 2026 - Refactoring Page Dispositifs + Appairage BLE Reel
**Correctifs critiques:**
- Corrige erreur login `Invalid salt` - reinitialisation des comptes admin/test
- Endpoint `POST /api/devices/associate` ne genere plus de fausses donnees (connected=false, battery=0)
- `GET /api/devices` filtre les appareils supprimes
- `GET /api/devices/dashboard-summary` filtre aussi les appareils supprimes (coherence)

**Refactoring page dispositifs (`devices.tsx`):**
- Bouton "Associer" -> flux d'appairage guide etape par etape -> "Lancer l'appairage" redirige vers la VRAIE page BLE
- Bracelet/Balance/Gilet: connexion BLE reelle via Web Bluetooth + bridge natif iOS
- PAS de header collant -- le titre scrolle avec le contenu
- Plus aucune donnee simulee -- tout passe par le vrai BLE

### Mar 2, 2026 - Correctifs Page Abonnement + Nora + Sante
- Header affiche le vrai nom du plan du contrat
- Prix correct 79.90 EUR affiche partout
- Onglet Logement pre-rempli depuis les donnees du contrat
- Onglet Gardiens affiche gardiens avec statut
- Bouton "Moyen de paiement" fonctionne (Stripe billing portal)

### Mar 1, 2026 - 10 Programmes de Prevention Scientifiques
1. "21 jours pour mieux dormir" (sommeil)
2. "14 jours pour stabiliser sa tension" (cardiovasculaire)
3. "30 jours pour bouger plus" (activite)
4. "21 jours pour mieux manger" (nutrition)
5. "21 jours pour prevenir les chutes" (equilibre)
6. "21 jours pour apaiser l'esprit" (bien-etre)
7. "14 jours pour booster sa memoire" (cognitif)
8. "21 jours pour renforcer son coeur" (cardio-endurance)
9. "14 jours pour ameliorer sa posture" (posture)
10. "14 jours pour mieux respirer" (respiratoire)

### Mar 1, 2026 - Nora IA Contextuelle & Intelligente
- Service nora_context.py avec contexte utilisateur complet
- Reponses coherentes sans donnees (tableaux vides)
- Chat enrichi avec connaissance des services Chutex

### Mar 1, 2026 - Fonctionnalites Avancees
- Rapport hebdomadaire email Nora
- Morning Briefing enrichi
- Streaks & Recompenses
- Nora Vocale TTS
- Alertes Predictives
- Mode Intervenant a Domicile

## Upcoming Tasks
- P0: Test complet par l'utilisateur (inscription, BLE, sante, dashboard)
- P1: Ameliorations UI/UX Programmes (blur, detail enrichi, bloquer si programme actif)
- P1: Safe area sur toutes les pages mobile
- P2: Regression complete UI/UX

## Future/Backlog
- Rapport PDF sante partageable
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Vue contrat PDF sur page abonnement
- Face ID/biometrie
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production

## Key Files
- `backend/routes/device_routes.py`: Endpoints dispositifs
- `backend/routes/health_report_routes.py`: Rapport sante (bug fix water_pct)
- `backend/routes/bracelet_routes.py`: Donnees BLE bracelet
- `frontend/src/pages/devices.tsx`: Page dispositifs avec BLE reel
- `frontend/app/_layout.tsx`: Bridge BLE natif iOS
- `backend/services/nora_context.py`: Contexte IA enrichi
- `backend/routes/program_routes.py`: Programmes sante + seed
