# Chutex Care Watch — PRD

## Objectif
Application de teleassistance et de suivi de sante preventif pour les personnes agees. Inclut le suivi des constantes vitales, la detection de chutes, l'assistance 24/7, et des recommandations IA (Nora).

## Stack technique
- **Frontend** : React Native Web (Expo Router)
- **Backend** : FastAPI + MongoDB
- **IA** : OpenAI GPT-4o (via Emergent LLM Key)
- **IoT** : Serveur TCP asyncio pour bracelet J2358 4G
- **Paiements** : Stripe (cle utilisateur requise)

## Architecture

### Backend (`/app/backend/`)
- `server.py` — Point d'entree FastAPI
- `routes/`
  - `auth_routes.py` — Authentification, inscription
  - `program_routes.py` (886 lignes) — Routes principales programmes
  - `program_seed_data.py` — Donnees statiques SEED_PROGRAMS
  - `program_helpers.py` — Fonctions utilitaires
  - `program_team_routes.py` — Routes equipes
  - `teleassistance_routes.py` (458 lignes) — Routes teleassistance
  - `escalation_routes.py` — Routes d'escalade
  - `intervention_routes.py` — Routes interventions CARE
  - `minceur_routes.py` — Poids & Nutrition
  - `guardian_routes.py` — Routes gardien
- `services/` — Services externes (ElevenLabs, VAPI, J2358 TCP)

### Frontend (`/app/frontend/`)
- `app/(tabs)/` — Pages principaux (dashboard, sante, programmes, profil)
- `app/(tabs)/profile.tsx` (772 lignes)
- `app/minceur.tsx` — Page Poids & Nutrition
- `app/health-readonly.tsx` — Vue sante gardien
- `src/components/dashboard/BeneficiaryHome.tsx` — Dashboard beneficiaire
- `src/components/dashboard/BeneficiaryPopups.tsx` — Popups CRUD rappels
- `src/components/profile/` — Composants profil extraits

## Fonctionnalites terminées
- [x] Design clinique (cartes grises, theme sombre)
- [x] Tableaux de bord Beneficiaire et Gardien
- [x] Vue sante read-only pour les gardiens
- [x] Fiche gardien dediee
- [x] Separation des champs d'adresse
- [x] Navigation gardien (page dediee avec slide-to-call)
- [x] Refactoring des fichiers monolithiques (Mars 2026)
- [x] Bug Fix: Carte "Poids & Nutrition" (gardien) → ouvre /minceur
- [x] Bug Fix: Rappels CRUD rafraichissement en temps reel (Mars 2026)
  - Ajout `await fetchData()` dans tous les handlers CRUD
  - Mise a jour optimiste du state pour la suppression
- [x] UI: Boutons ronds (pill-shaped) partout (Mars 2026)
  - borderRadius: 999 applique sur tous les boutons d'action
  - Fichiers: BeneficiaryPopups, BeneficiaryHome, metric-detail, glycemia-detail, ecg, beneficiary-detail

## En cours / Prochaines taches
- [ ] **P1** : Integration Balance & Gilet
- [ ] **P1** : Systeme de Signature Electronique (Admin → Documents)
- [ ] **BLOQUE** : CRC32 pour serveur TCP J2358 (attente fabricant)

## Backlog futur
- [ ] P2 : Systeme de parrainage Gardien
- [ ] P2 : Essai gratuit 7 jours
- [ ] P2 : Integration test urinaire Vivoo

## Identifiants de test
- Beneficiaire : `0651245918` / `test123`
- Gardien : `+33612345678` / `test123`

## Integrations tierces
- OpenAI GPT-4o — Emergent LLM Key
- Stripe (Payments) — cle API utilisateur requise
