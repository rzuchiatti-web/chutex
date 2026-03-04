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

### Mar 4, 2026 - 3 UI/UX Guardian Fixes
- **Bug Fix (P0)**: Bouton notifications du dashboard gardien web - ajout popup full-screen notifications manquant dans la version web de `GuardianHome.tsx`. Le popup affiche alertes actives (badge URGENT), interventions en attente, et invitations gardien.
- **UI Verification**: Page detail beneficiaire - profil+dossier medical fusionnes, grille icones (adresse, ville, age, genre, groupe sanguin), taille/poids en cartes, pathologies/allergies.
- **UI Verification**: Popup gardien redesign - avatar initiales, nom, badge relation, telephone, type, boutons Appeler/SMS, historique d'activite.
- Tests: iteration_83 - Frontend 100% (18/18 features verified)

### Mar 4, 2026 - Fix recommendations Nora sans donnees
- **Correction scoring** : `compute_subscores` renvoie `no_data=true` / score 0 quand aucune mesure valide
- **Sanitisation des donnees** : `_sanitize_data()` filtre les valeurs erronees (poids > 250kg, temp < 30C ambiante, FC > 220)
- **Plan quotidien** : N'affiche que les items avec de vraies donnees mesurees, sinon "Connecter un appareil"
- **Section analysis** : Retourne `no_data=true` avec recommandation adaptee quand pas de donnees
- **Suppression simulation sommeil** : `computeSleepForDate` remplacee par vrais donnees API
- **Frontend** : `getValue` retourne '--' pour valeurs 0, barres de jauge masquees sans donnees
- **Fallback IA** : Plus de fausses affirmations ("FC dans les normes") -- messages honnetes
- Tests: iteration_82 - Backend 11/11, Frontend 100%

### Mar 3, 2026 - Refactoring devices.tsx en composants modulaires
- **Refactoring complet** de `devices.tsx` (2338 -> 1772 lignes, -566 lignes)
- **Hooks extraits**: `useDeviceData.ts`, `useBleConnection.ts`
- **Composants extraits**: `DeviceCard.tsx`, `PairingOverlays.tsx`, `DeviceDetailPopup.tsx`, `NoSubscriptionPopup.tsx`, `GlassOverlay.tsx`, `constants.ts`
- **DeviceManagement.tsx**: Conteneur leger qui compose hooks + composants
- Tests: iteration_81 - Frontend 10/10 (100%)

### Mar 3, 2026 - Push Notifications + Refonte Programmes
- Push Notifications pour alertes safe zone + dispatch aux gardiens
- Programmes - Refonte complete : pages `programs.tsx` et `program-detail.tsx`
- Tests: iteration_80 - Backend 7/7 (100%) + Frontend 100%

### Mar 3, 2026 - P0 Bug Fix Alertes + UI Finitions beneficiaire
- Corrige crash page Alertes - `getAlertLabel` gere le type `geofence`
- Badge gilet "En veille" confirme orange (#F59E0B)
- Tests: iteration_79 - 100% backend + 100% frontend

### Mar 3, 2026 - Refonte fiche beneficiaire gardien + Dispositifs
- Refonte complete beneficiary-detail.tsx : header compact, analyse Nora IA, 3 cartes dispositifs, grille sante, dossier medical, localisation, historique alertes
- Badge gilet : seuil 30s pour "En marche" / "En veille"
- Endpoint guardian AI report via GPT-5.2

### Mar 2, 2026 - BLE Gilet + Bracelet + Suppression Simulation
- Gilet: parsing protocole texte S-AIRBAG, detection chute -> alerte + escalade gardiens
- Bracelet: fix batterie
- Suppression TOTALE simulation

### Mar 2, 2026 - Fix Switch Beneficiaire/Gardien + Nettoyage DB

### Mar 2, 2026 - Refactoring Page Dispositifs + Appairage BLE Reel

### Mar 2, 2026 - Correctifs Page Abonnement + Nora + Sante

### Mar 1, 2026 - 10 Programmes de Prevention Scientifiques

### Mar 1, 2026 - Nora IA Contextuelle & Intelligente + Fonctionnalites Avancees

## Upcoming Tasks
- P0: Validation utilisateur en conditions reelles BLE (bracelet/gilet/balance) sur appareils physiques
- P1: Test iOS TestFlight complet du bridge BLE natif
- P1: Complete devices.tsx refactor (PrescriptionManagement etc. still in monolithic file)
- P2: Regression UI globale roles gardien/SAAD/admin

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
- `backend/routes/health_report_routes.py`: Rapport sante
- `backend/routes/contract_routes.py`: Contrat + export PDF
- `backend/services/health_logic.py`: Logique sante + sanitisation
- `frontend/app/beneficiary-detail.tsx`: Fiche detaillee gardien + carte safe zones
- `frontend/src/components/dashboard/GuardianHome.tsx`: Dashboard gardien web + notifications popup
- `frontend/app/guardian-detail.tsx`: Page detail gardien standalone
- `frontend/app/(tabs)/devices.tsx`: Page dispositifs avec BLE reel
- `frontend/app/(tabs)/health.tsx`: Vue sante (no fake data rendering)
- `frontend/app/programs.tsx`: Catalogue programmes refondu
- `frontend/app/subscription.tsx`: Contrat & paiement avec ouverture PDF
