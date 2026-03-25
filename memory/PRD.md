# Chutex Care Watch - PRD

## Vision Produit
Application de suivi santé connecté pour seniors/personnes à risque, avec gardiens et professionnels de santé.

## Rôles
- **Bénéficiaire** : Patient porteur de la montre
- **Gardien** : Famille/proche qui surveille
- **Professionnel (Coach/Kiné)** : Gardien enrichi avec outils de prescription

## Architecture
- Frontend: Expo React Native Web
- Backend: FastAPI + MongoDB (vitallink_db)
- IA: GPT-5.2 via Emergent LLM Key (Nora)
- Paiement: Mollie (clés test + live)

## Fonctionnalités Implémentées

### Core App (DONE)
- Onboarding, auth, dashboard bénéficiaire/gardien
- Chat IA Nora, rappels, programme minceur, téléconsultation
- J2358 TCP Server montre connectée

### Module Pro - Phase 1+2 (DONE)
- Rôle professional, dashboard = GuardianHome enrichi
- ProSpace : programmes + exercices

### Module Pro - Phase 3 (DONE)
- Rappels Pro (compléments/hydratation) → rappels existants bénéficiaire
- Repas Pro : CRUD repas patient
- Exercices prescrits dans page activité + validation
- Bilans Nora (hebdo/mensuel via GPT)

### Module Pro - Phase 4 : Abonnements via Prescription (DONE - 25/03/2026)
- Types d'abonnement dans la page PRESCRIPTION existante :
  - Bracelet Elio : 39,90€/mois
  - Bracelet + Gilet Elder : 79,90€/mois
  - **Sport : 89€/mois TTC (45€ HT)** — NOUVEAU
  - **Physio : 89€/mois TTC (45€ HT)** — NOUVEAU
- Commission plateforme sport/physio : 44€/transaction
- Le pro utilise la page prescription (pas un onglet séparé)
- SMS et email adapté au type d'abonnement

### Module Pro - Phase 5 : Paiements Mollie (DONE - 25/03/2026)
- Intégration Mollie complète (test + live keys)
- Création paiement, webhook, abonnement récurrent mensuel
- Historique paiements, simulation pour tests
- Email Mollie fix (format valide pour numéros de téléphone)

### Module Pro - Phase 6 : Messagerie (DONE - 25/03/2026)
- Chat texte Pro ↔ Bénéficiaire avec polling (4-5s)
- Compteur messages non lus
- ProSpace : 5 onglets (Programmes, Rappels, Repas, Messages, Bilans)
- Page dédiée côté bénéficiaire (pro-chat.tsx)
- Raccourci messagerie sur dashboard bénéficiaire

### Autorisations Partage Santé (DONE)
- Bénéficiaire choisit all/vitals_only/none

## Tâches à Venir (Backlog P2)
- Intégration Balance & Gilet connecté
- Système Signature Électronique
- Parrainage Gardiens
- Essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Validation CRC32 J2358 TCP (BLOQUÉ)

## Fichiers Clés
- `/app/backend/routes/professional_routes.py` : Programmes, rappels, repas, bilans
- `/app/backend/routes/pro_subscription_routes.py` : Mollie + Messagerie
- `/app/backend/routes/guardian_routes.py` : Prescriptions (sport/physio)
- `/app/frontend/src/components/dashboard/ProSpace.tsx` : 5 onglets
- `/app/frontend/src/components/devices/PrescriptionManagement.tsx` : Types sport/physio
- `/app/frontend/app/pro-chat.tsx` : Chat bénéficiaire

## Identifiants de Test
- Bénéficiaire: `0651245918` / `test123`
- Gardien: `+33612345678` / `test123`
- Pro (Coach): `+33655443322` / `test123` (is_prescriber=true)
