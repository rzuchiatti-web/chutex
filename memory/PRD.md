# Chutex Care Watch — PRD

## Objectif
Application de teleassistance et de suivi de sante preventif pour les personnes agees. Inclut le suivi des constantes vitales, la detection de chutes, l'assistance 24/7, et des recommandations IA (Nora).

## Stack technique
- **Frontend** : React Native Web (Expo Router), React 19.1.0
- **Backend** : FastAPI + MongoDB (Motor)
- **IA** : OpenAI GPT-4o (via Emergent LLM Key)
- **IoT** : Serveur TCP asyncio pour bracelet J2358 4G
- **Paiements** : Stripe (cle utilisateur requise)

## Architecture

### Backend (`/app/backend/`)
- `server.py` — Point d'entree FastAPI
- `routes/`
  - `auth_routes.py` — Authentification, inscription
  - `program_routes.py` — Routes principales programmes
  - `program_seed_data.py` — Donnees statiques SEED_PROGRAMS
  - `program_helpers.py` — Fonctions utilitaires
  - `program_team_routes.py` — Routes equipes
  - `teleassistance_routes.py` — Routes teleassistance
  - `escalation_routes.py` — Routes d'escalade
  - `intervention_routes.py` — Routes interventions CARE
  - `minceur_routes.py` — Poids & Nutrition
  - `guardian_routes.py` — Routes gardien
  - `misc_routes.py` — Endpoints Reminders
- `services/` — Services externes (ElevenLabs, VAPI, J2358 TCP)

### Frontend (`/app/frontend/`)
- `app/(tabs)/` — Pages principaux (dashboard, sante, programmes, profil)
- `app/index.tsx` — Page login
- `app/onboarding.tsx` — Onboarding
- `src/components/dashboard/BeneficiaryHome.tsx` — Dashboard beneficiaire (etat global, fetch)
- `src/components/dashboard/BeneficiaryPopups.tsx` — Popups CRUD rappels (etat local independant)
- `src/services/api.ts` — Wrapper Fetch avec gestion de cache

## Fonctionnalites terminees
- [x] Design clinique (cartes grises, theme sombre)
- [x] Tableaux de bord Beneficiaire et Gardien
- [x] Vue sante read-only pour les gardiens
- [x] Fiche gardien dediee
- [x] Separation des champs d'adresse
- [x] Navigation gardien (page dediee avec slide-to-call)
- [x] Refactoring des fichiers monolithiques (Mars 2026)
- [x] Bug Fix: Carte "Poids & Nutrition" (gardien) -> ouvre /minceur
- [x] Bug Fix: Rappels CRUD rafraichissement en temps reel (Mars 2026)
  - Solution definitive: `ReminderCRUDPopup` gere son propre etat local (`localReminders`) avec `refreshLocal()` pour contourner le batching React 19
  - Mises a jour optimistes pour toggle et suppression
  - Retire: `flushSync`, `remKey` (contournements inutiles)
  - Fichiers modifies: `BeneficiaryPopups.tsx`, `BeneficiaryHome.tsx`
- [x] UI: Boutons ronds (pill-shaped) partout (Mars 2026)
  - borderRadius: 999 applique sur tous les boutons d'action
- [x] Fix API: Cache bypass dans api.ts (cache: no-store, nettoyage inflight)

- [x] UI: Header avec image en fond sur la page gardien detail (Mars 2026)
  - Meme pattern que beneficiary-detail: BG_RED, avatar, nom, badges, slide-to-call
  - Contenu en carte arrondie chevauchant le header
  - Fichier modifie: `guardian-detail.tsx`

## En cours / Prochaines taches
- [ ] **P1** : Integration Balance & Gilet
- [ ] **P1** : Systeme de Signature Electronique (Admin -> Documents)
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

## Notes techniques importantes
- Le frontend tourne sur React 19.1.0 (batching asynchrone automatique)
- `api.ts` utilise `cache: 'no-store'` et gere le deduplicate inflight
- Les popups enfants doivent gerer leur propre etat local pour eviter les problemes de synchronisation React 19
