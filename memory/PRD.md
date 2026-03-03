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

### Mar 3, 2026 - Refonte fiche beneficiaire gardien + Dispositifs
- Refonte complete beneficiary-detail.tsx : header compact, analyse Nora IA, 3 cartes dispositifs, grille sante 3 colonnes (toutes metriques), dossier medical, localisation, historique alertes
- Graph BPM/ECG supprime, donnees simulees supprimees
- Badge gilet : seuil 30s partout (backend + frontend) pour "En marche" / "En veille"
- DeviceCards dashboard : gilet affiche "En marche" (vert) / "En veille" (orange)
- Popup detail : statut gilet + ID MAC + bouton Synchroniser
- Endpoint guardian AI report genere analyse Nora en temps reel via GPT-5.2

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

## Mise a jour — Mar 3, 2026 (Fork continuation)
### Livrables completes (P0 + P1 + P2 partiel)
- **P0 Sante**: suppression d'affichages perçus comme simules sur la page Sante.
  - Les vitaux absents s'affichent en `--` / `Aucune donnee`.
  - Le score Nora est masque si les mesures physiologiques valides sont insuffisantes.
  - Les objectifs journaliers sont filtres pour n'afficher que des objectifs bases sur donnees reelles.
- **P0 Pesée balance**: validation du flux pesée reelle + mapping historique corrige sur dashboard (`/api/devices/scale/history` -> format UI).
- **P1 Badge gilet**: harmonisation du badge **En veille** en orange dans les cartes dispositifs (dashboard/details).
- **P2 Programmes (UI/UX + logique)**:
  - Refonte visuelle page `/programs` (glass/blur, hero, filtres categorie, etat lock).
  - Logique explicite "un seul programme actif" visible et bloquante dans le catalogue.
  - Enrichissement `/program-detail` (warning conflit programme actif, contenus enrichis, CTA bloques si conflit).
- **P2 Contrat PDF (abonnement)**:
  - Backend: nouveaux endpoints PDF fonctionnels:
    - `GET /api/contract/template/pdf`
    - `GET /api/contract/{contract_id}/pdf`
  - Frontend subscription: bouton **Voir PDF** (et telechargement contrat en confirmation).
- **Suppression simulation**: endpoint de seed demo balance retire (`/api/devices/scale/seed-history`) pour eviter toute recurrence de donnees factices.

### Mise a jour — Mar 3, 2026 (Guardian Safe Zones)
- **NOUVEAU (Gardien)**: gestion complete des safe zones depuis la fiche beneficiaire detaillee et l'ecran geofencing.
  - CRUD complet des safe zones pour tous les gardiens lies au beneficiaire.
  - Source centre de zone: localisation beneficiaire (si dispo) + saisie manuelle.
  - Actions rapides dans `beneficiary-detail`: actualiser, creer depuis localisation, activer/desactiver, supprimer, ouvrir gestion avancee.
- **Backend ajoute**:
  - `GET /api/guardian/beneficiary/{bid}/geofence`
  - `POST /api/guardian/beneficiary/{bid}/geofence`
  - `PUT /api/guardian/beneficiary/{bid}/geofence/{gid}`
  - `PUT /api/guardian/beneficiary/{bid}/geofence/{gid}/toggle`
  - `DELETE /api/guardian/beneficiary/{bid}/geofence/{gid}`
  - `POST /api/guardian/beneficiary/{bid}/geofence/check`
- **Compatibilite geofence standard**: endpoint update ajoute `PUT /api/geofence/{gid}` + payload check/toggle harmonise.
- **Data integrity**: retrait du fallback de localisation aleatoire cote guardian map (plus de simulation implicite).
- **UX mobile/web regression**: validee par testing agent (iteration_70, backend 100%, frontend 100%).

### Mise a jour — Mar 3, 2026 (Location Permission + Popup Glass)
- **Correction root cause localisation indisponible**:
  - Prompt de permission localisation ajoute au **premier lancement**.
  - Cible: iOS + Android + Web fallback.
  - Flux implemente: demande foreground puis background (mode "Toujours"), avec guide si refus.
  - Actions guide: **Ouvrir Reglages** + **Reessayer**.
- **Sync localisation beneficiaire**:
  - Ajout envoi periodique de la position (`/api/location/update`) depuis le dashboard beneficiaire.
- **Safe Zone manager UX**:
  - Le bouton "Gerer" depuis la fiche beneficiaire ouvre maintenant une **popup glass complete** (plus de navigation vers page percue comme cassee).
  - Popup: create/edit/toggle/delete/check + formulaire complet + reprise de la localisation beneficiaire.
- **Permissions natives app config**:
  - iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription`, `UIBackgroundModes.location`.
  - Android: `ACCESS_BACKGROUND_LOCATION` ajoute.
- **Validation qualite**:
  - testing agent `iteration_71`: **frontend 100% / backend 100%**.

### Mise a jour — Mar 3, 2026 (Simplification Safe Zones UX)
- UX simplifiee selon demande utilisateur:
  - Carte Safe Zones directe dans `beneficiary-detail` avec **carte OSM + localisation beneficiaire**.
  - Bouton unique: **Definir une zone depuis la localisation**.
  - Popup glass simplifiee: **Nom + Rayon (m)** uniquement (centre auto depuis la localisation beneficiaire).
  - Liste zones conservee en dessous avec **Modifier / Supprimer**.
- Nettoyage UX:
  - Boutons **Actualiser** et **Gerer** supprimes de la carte.
  - Ancien flux geofencing deprecie, redirection vers le nouveau flux.
- Validation qualite:
  - testing agent `iteration_73`: **frontend 100% / backend 100%** (no issues).

## Upcoming Tasks
- P0: validation utilisateur en conditions reelles BLE (bracelet/gilet/balance) sur appareils physiques
- P1: test iOS TestFlight complet du bridge BLE natif
- P2: regression UI globale roles gardien/SAAD/admin

## Future/Backlog
- Systeme de parrainage gardien
- Programme d'essai gratuit 7 jours
- Face ID / biometrie
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production

> Decision produit: **Rapport PDF sante partageable retire du scope** (demande utilisateur explicite).

## Key Files
- `backend/routes/device_routes.py`: Endpoints dispositifs
- `backend/routes/guardian_routes.py`: Endpoints gardien + geofence beneficiary CRUD
- `backend/routes/misc_routes.py`: Geofence standard (create/update/toggle/check)
- `backend/routes/health_report_routes.py`: Rapport sante
- `backend/routes/contract_routes.py`: Contrat + export PDF template/signe
- `backend/routes/bracelet_routes.py`: Donnees BLE bracelet
- `frontend/app/beneficiary-detail.tsx`: Fiche detaillee gardien + carte safe zones
- `frontend/app/geofencing.tsx`: Gestion safe zones (self + mode gardien)
- `frontend/app/(tabs)/devices.tsx`: Page dispositifs avec BLE reel
- `frontend/src/components/dashboard/DeviceCards.tsx`: Badges statut dispositifs dashboard
- `frontend/app/(tabs)/health.tsx`: Vue sante (no fake data rendering)
- `frontend/app/programs.tsx`: Catalogue programmes refondu
- `frontend/app/program-detail.tsx`: Detail programme enrichi + lock programme actif
- `frontend/app/subscription.tsx`: Contrat & paiement avec ouverture PDF
- `frontend/app/_layout.tsx`: Bridge BLE natif iOS
- `backend/services/nora_context.py`: Contexte IA enrichi
- `backend/routes/program_routes.py`: Programmes sante + seed
