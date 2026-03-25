# Chutex Care Watch - PRD

## Vision Produit
Application de suivi santé connecté pour seniors/personnes à risque, avec gardiens et professionnels de santé.

## Rôles
- **Bénéficiaire** : Patient porteur de la montre, reçoit exercices, rappels, repas
- **Gardien** : Famille/proche qui surveille les données vitales
- **Professionnel (Coach/Kiné)** : Gardien enrichi avec outils de prescription

## Architecture
- Frontend: Expo React Native Web
- Backend: FastAPI + MongoDB
- IA: GPT-5.2 via Emergent LLM Key (Nora)
- Paiement: Mollie (clés test + live disponibles)

## Fonctionnalités Implémentées

### Core App (DONE)
- Onboarding, auth, dashboard bénéficiaire/gardien
- Chat IA Nora, rappels, programme minceur, téléconsultation
- J2358 TCP Server pour montre connectée

### Autorisations Partage Santé (DONE)
- Bénéficiaire choisit all/vitals_only/none

### Module Pro - Phase 1+2 (DONE)
- Rôle professional (coach/physio), dashboard = GuardianHome enrichi
- ProSpace : programmes + exercices

### Module Pro - Phase 3 (DONE - 24/03/2026)
- Rappels Pro (compléments/hydratation) → rappels existants bénéficiaire
- Repas Pro : CRUD repas patient (override minceur)
- Exercices prescrits dans page activité + validation
- Bilans Nora (hebdo/mensuel via GPT)

### Module Pro - Phase 4 : Abonnements (DONE - 25/03/2026)
- Pro propose abonnement Sport/Physio à 89€/mois TTC (45€ HT)
- Bénéficiaire accepte/refuse sur son dashboard
- Commission plateforme: 44€/transaction
- Gestion statuts (pending/active/cancelled)

### Module Pro - Phase 5 : Paiements Mollie (DONE - 25/03/2026)
- Intégration Mollie (test + live keys)
- Création paiement à l'acceptation de l'abonnement
- Webhook Mollie pour mise à jour statuts
- Abonnement récurrent mensuel automatique
- Historique paiements pour le pro
- Page de statut post-paiement
- Simulation paiement pour tests

### Module Pro - Phase 6 : Messagerie (DONE - 25/03/2026)
- Chat texte Pro ↔ Bénéficiaire
- Conversations avec polling (4-5s)
- Compteur messages non lus
- Page dédiée côté bénéficiaire (pro-chat.tsx)
- Onglet Messages dans ProSpace
- Badge notifications sur dashboard bénéficiaire

## Tâches à Venir

### P2 - Backlog
- Intégration Balance & Gilet connecté
- Système Signature Électronique (Admin → Documents)
- Parrainage Gardiens
- Essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Validation CRC32 J2358 TCP (BLOQUÉ)

## Fichiers Clés Phase 4/5/6
- `/app/backend/routes/pro_subscription_routes.py` : Abonnements + Mollie + Messagerie
- `/app/frontend/src/components/dashboard/ProSpace.tsx` : 6 onglets (Programmes, Rappels, Repas, Abo, Messages, Bilans)
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx` : Carte abo + raccourci messages
- `/app/frontend/app/pro-chat.tsx` : Page chat bénéficiaire
- `/app/frontend/app/subscription-status.tsx` : Statut post-paiement

## Identifiants de Test
- Bénéficiaire: `0651245918` / `test123`
- Gardien: `+33612345678` / `test123`
- Pro (Coach): `+33655443322` / `test123`
