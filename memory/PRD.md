# Chutex Care Watch — PRD

## Objectif
Application de téléassistance et de suivi de santé préventif pour les personnes âgées. Inclut le suivi des constantes vitales, la détection de chutes, l'assistance 24/7, et des recommandations IA (Nora).

## Stack technique
- **Frontend** : React Native Web (Expo Router)
- **Backend** : FastAPI + MongoDB
- **IA** : OpenAI GPT-4o (via Emergent LLM Key)
- **IoT** : Serveur TCP asyncio pour bracelet J2358 4G
- **Paiements** : Stripe (clé utilisateur requise)

## Architecture

### Backend (`/app/backend/`)
- `server.py` — Point d'entrée FastAPI
- `routes/`
  - `auth_routes.py` — Authentification, inscription
  - `program_routes.py` (886 lignes) — Routes principales programmes
  - `program_seed_data.py` — Données statiques SEED_PROGRAMS
  - `program_helpers.py` — Fonctions utilitaires (transform_task_text, enrich_tasks_interactive)
  - `program_team_routes.py` — Routes équipes (création, invitation, leaderboard)
  - `teleassistance_routes.py` (458 lignes) — Routes téléassistance + Twilio/ElevenLabs
  - `escalation_routes.py` — Routes d'escalade + auto_escalation_protocol
  - `intervention_routes.py` — Routes interventions CARE
  - `minceur_routes.py` — Poids & Nutrition (supporte `beneficiary_id` pour vue gardien)
  - `guardian_routes.py` — Routes gardien
- `services/` — Services externes (ElevenLabs, VAPI, J2358 TCP)
- `models.py` — Modèles Pydantic
- `auth.py` — Authentification JWT + SAFE_FIELDS

### Frontend (`/app/frontend/`)
- `app/(tabs)/` — Pages principaux (dashboard, santé, programmes, profil)
- `app/(tabs)/profile.tsx` (772 lignes) — Page profil (refactorisée)
- `app/minceur.tsx` — Page Poids & Nutrition (supporte beneficiaryId param)
- `app/health-readonly.tsx` — Vue santé gardien (Poids card → /minceur)
- `src/components/profile/` — Composants profil extraits :
  - `ProfileMedicalPopup.tsx` — Popup dossier médical
  - `ProfileLegalPopups.tsx` — RGPD, Confidentialité, CGU, Mentions
  - `ProfileBenActivation.tsx` — Activation espace bénéficiaire

## Fonctionnalités terminées
- [x] Design clinique (cartes grises, thème sombre)
- [x] Tableaux de bord Bénéficiaire et Gardien
- [x] Vue santé read-only pour les gardiens
- [x] Fiche gardien dédiée (`guardian-detail.tsx`)
- [x] Séparation des champs d'adresse (adresse, code postal, ville, pays)
- [x] Navigation gardien (page dédiée avec slide-to-call)
- [x] Refactoring des fichiers monolithiques (Mars 2026)
  - program_routes.py : 1866 → 886 lignes (-53%)
  - teleassistance_routes.py : 1131 → 458 lignes (-60%)
  - profile.tsx : 1071 → 772 lignes (-28%)
- [x] Bug Fix: Carte "Poids & Nutrition" (gardien) → ouvre /minceur au lieu de metric-detail (Mars 2026)
  - Backend: ajout `beneficiary_id` param à `/api/minceur/weight-details`
  - Frontend: navigation vers `/minceur?beneficiaryId=X` + mode lecture seule

## En cours / Prochaines tâches
- [ ] **P0** : Intégration Balance & Gilet (à démarrer)
- [ ] **P1** : Système de Signature Électronique (Admin → Documents)
- [ ] **BLOQUÉ** : CRC32 pour serveur TCP J2358 (attente fabricant)

## Backlog futur
- [ ] P2 : Système de parrainage Gardien
- [ ] P2 : Essai gratuit 7 jours
- [ ] P2 : Intégration test urinaire Vivoo

## Identifiants de test
- Bénéficiaire : `0651245918` / `test123`
- Gardien : `+33612345678` / `test123`

## Intégrations tierces
- OpenAI GPT-4o — Emergent LLM Key
- Stripe (Payments) — clé API utilisateur requise
