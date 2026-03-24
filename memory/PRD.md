# Chutex Care Watch - PRD

## Vision Produit
Application de suivi santé connecté pour seniors/personnes à risque, avec gardiens et professionnels de santé.

## Rôles
- **Bénéficiaire** : Patient porteur de la montre, reçoit exercices, rappels, repas
- **Gardien** : Famille/proche qui surveille les données vitales
- **Professionnel (Coach/Kiné)** : Gardien enrichi avec outils de prescription (programmes, rappels, repas, bilans)

## Architecture
- Frontend: Expo React Native Web
- Backend: FastAPI + MongoDB
- IA: GPT-5.2 via Emergent LLM Key (Nora)

## Fonctionnalités Implémentées

### Core App (DONE)
- Onboarding, auth (phone/password)
- Dashboard bénéficiaire (vitales, rappels, activité, minceur)
- Dashboard gardien (suivi bénéficiaires, alertes)
- Chat IA Nora
- Système de rappels (traitement, hydratation, alarmes)
- Programme minceur (repas IA, exercices, tracking)
- Téléconsultation
- J2358 TCP Server pour montre connectée

### Autorisations Partage Santé (DONE)
- Page `data-sharing.tsx` : bénéficiaire choisit all/vitals_only/none
- Vue gardien respecte les permissions

### Module Professionnel - Phase 1+2 (DONE)
- Rôle `professional` (coach/physio) hérite de gardien
- Dashboard Pro réutilise GuardianHome
- ProSpace : création programmes + exercices

### Module Professionnel - Phase 3 (DONE - 24/03/2026)
- **Rappels Pro** : Pro prescrit compléments (medication) et hydratation → rappels existants du bénéficiaire
- **Repas Pro** : Pro voit/ajoute/supprime repas du patient (override minceur)
- **Exercices chez le patient** : Page activité affiche exercices prescrits avec validation (fait/partiel/passé + douleur)
- **Masquage exercices minceur** : Si programmes pro actifs, les exercices auto-générés sont masqués
- **Bilans Nora** : Génération bilans hebdo/mensuels via IA (vitales, programmes, compléments)
- **ProSpace 4 onglets** : Programmes, Rappels, Repas, Bilans

## Tâches à Venir

### P1 - Phase 4 : Abonnements Sport/Physio
- Prescription d'abonnements par les pros
- Si abonnement actif, exercices gérés exclusivement par le pro

### P1 - Phase 5 : Intégration Mollie
- Paiements pour services pro via Mollie (pas Stripe)
- Commission plateforme Chutex

### P1 - Phase 6 : Messagerie Pro ↔ Bénéficiaire
- Chat direct entre pro et patient

### P2 - Backlog
- Intégration Balance & Gilet connecté
- Signature Électronique (Admin → Documents)
- Parrainage Gardiens
- Essai gratuit 7 jours
- Test urinaire Vivoo
- Validation CRC32 J2358 TCP (BLOQUÉ)

## Endpoints Clés Phase 3
- `POST /api/pro/reminders/{ben_id}` - Prescrire rappel
- `GET/DELETE /api/pro/reminders/*` - CRUD rappels pro
- `GET/POST/DELETE /api/pro/meals/{ben_id}` - Gestion repas
- `GET /api/pro/has-active-programs` - Vérifier programmes actifs
- `GET /api/pro/my-programs` - Programmes prescrits du bénéficiaire
- `POST /api/pro/sessions/{prog_id}/{sess_id}/complete` - Validation exercice
- `GET /api/pro/bilan/{ben_id}` - Générer bilan Nora

## Identifiants de Test
- Bénéficiaire: `0651245918` / `test123`
- Gardien: `+33612345678` / `test123`
- Pro (Coach): `+33655443322` / `test123`
