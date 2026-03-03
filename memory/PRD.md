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
| Beneficiary | 0651245918 | test123 |
| Admin | admin@chutex.fr | demo123 |
| SAAD | 0499887766 | demo123 |
| Guardian #1 | 0612345678 | test123 |
| Guardian #2 | 0698765432 | test123 |

## Completed Features

### Mar 3, 2026 - Refactoring devices.tsx en composants modulaires
- **Refactoring complet** de `devices.tsx` (2338 → 1772 lignes, -566 lignes)
- **Hooks extraits**: `useDeviceData.ts` (fetch devices, subscription, pesees, sync/remove), `useBleConnection.ts` (logique BLE, scan, appairage)
- **Composants extraits**: `DeviceCard.tsx` (carte individuelle par appareil), `PairingOverlays.tsx` (popups etapes/scan/connecte/erreur), `DeviceDetailPopup.tsx` (popup detail), `NoSubscriptionPopup.tsx`, `GlassOverlay.tsx`, `constants.ts`
- **DeviceManagement.tsx**: Conteneur leger qui compose hooks + composants
- **Aucun changement fonctionnel** - le comportement et l'UI sont identiques
- Tests: iteration_81 - Frontend 10/10 (100%)

### Mar 3, 2026 - Push Notifications + Refonte Programmes
- **Push Notifications**: Ajout `notify_geofence_exit` pour alertes safe zone + dispatch aux gardiens
- **Push Preferences**: Ajout `geofence_alerts` aux preferences push (true par defaut)
- **Geofence Check**: `POST /api/geofence/check` envoie maintenant push notification aux gardiens en cas de sortie de zone
- **Programmes - Refonte complete** : pages `programs.tsx` et `program-detail.tsx` reecrites a partir de zero
  - Meme fond que le dashboard (BG_IMAGES.beneficiary)
  - Filtres categorie avec icones (sommeil, cardiovasculaire, stress, nutrition, mobilite)
  - Cartes programme avec hover animation et gradient d accent
  - Programme actif: hero card avec barre de progression, phases, mission du jour, streak
  - Detail programme: flow en 4 etapes (presentation, personnalisation, invitation equipe, lancement)
  - Phases, benefices, metriques suivies, disclaimer medical
- Tests: iteration_80 - Backend 7/7 (100%) + Frontend 100%

### Mar 3, 2026 - P0 Bug Fix Alertes + UI Finitions beneficiaire
- **P0 FIX**: Corrige crash page Alertes - `getAlertLabel` gere le type `geofence` ("Sortie de safe zone")
- **P0 FIX**: Corrige crash `alert-detail.tsx` quand `data` est null (ajout null guard)
- **P0 FIX**: Corrige reference variable `d` indéfinie dans `beneficiary-detail.tsx` ligne 199
- **P1 UI**: Prénom + Nom sur la MÊME LIGNE (flex horizontal)
- **P1 UI**: Taille / Poids séparés en cartes distinctes avec icônes (ruler + scales)
- **P1 UI**: Badge gilet "En veille" confirmé orange (#F59E0B) dans toutes les vues
- Backend: `type_labels` dict dans `alert_routes.py` inclut `geofence` et `geofence_exit`
- Tests: iteration_79 - 100% backend + 100% frontend

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

### Mise a jour — Mar 3, 2026 (Refonte fiche beneficiaire)
- Reorganisation complete de la page detaillee (ordre exact):
  1) Analyse Nora
  2) Constantes vitales
  3) Dossier medical
  4) Dispositifs
  5) Liste des gardiens
  6) Contrat Care/Standard
  7) Safe zones
- Toutes les sections principales sont affichees en **cartes blur/glass**.
- **Gardiens**: cartes cliquables + popup glass detaillee avec infos gardien et bloc historique d'activite.
- **Contrat**: carte resume (actif/inactif) + popup glass details (date souscription, offre, paiement, statut, numero contrat).
- Safe zones conservees fonctionnelles apres refonte.
- Validation qualite: testing agent `iteration_74` = **backend 100% (9/9) + frontend 100%**.

### Mise a jour — Mar 3, 2026 (Parite visuelle popups + carte contrat)
- Popups de la fiche beneficiaire harmonisees avec le style de reference "Ajouter beneficiaire" (overlay blur plein ecran, carte glass, bouton fermeture top-right):
  - Popup detail gardien
  - Popup detail contrat
  - Popup creation/modification safe zone
- Carte contrat de la fiche beneficiaire alignee visuellement sur la carte abonnement du profil beneficiaire (image de fond + overlay sombre + pill statut).
- Validation qualite: testing agent `iteration_75` = **frontend 100%**, aucune anomalie.

### Mise a jour — Mar 3, 2026 (Ajustements layout finaux fiche beneficiaire)
- Ajustements UX demandes:
  - En tete plus lisible avec **prenom + nom + age + genre + adresse**.
  - Section dispositifs sans effet "carte dans carte" (mini-cartes directes, sans wrapper externe).
  - Carte contrat deplacee **tout en bas** de la page et sans wrapper externe.
- Validation qualite:
  - testing agent `iteration_76` = **frontend 100%** (ordre, structure, popups, carte contrat, no regression).

### Mise a jour — Mar 3, 2026 (Fusion Profil + Dossier)
- En tete simplifiee: uniquement **prenom + nom** en grand, centre, sans badges.
- Fusion des informations personnelles (adresse, age, genre, taille/poids, groupe sanguin) et du dossier medical (pathologies, allergies) dans **une seule carte**.
- Le reste de la page est conserve (dispositifs, gardiens, safe zones, contrat en bas).
- Validation qualite:
  - testing agent `iteration_77` = **frontend 100%** (6/6 exigences validees).

### Mise a jour — Mar 3, 2026 (Passage pixel-perfect final)
- Finition visuelle de `beneficiary-detail`:
  - Espacements/alignements harmonises
  - Hierarchie typo ajustee
  - Rayons/bordures unifies
  - Animations d'ouverture subtiles sur popups (`beneficiary-popup-in`)
- Validation qualite:
  - testing agent `iteration_78` = **frontend 100%** (6/6, desktop + tablet, no overflow).

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
