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
| Admin | admin@chutex.fr | demo123 |
| Beneficiaire (Robin) | +33651245918 | test123 |
| Teleassistance | plateau@chutex.fr | demo123 |

## Completed Features

### Mar 2, 2026 - Refactoring Page Dispositifs + Appairage BLE Reel
**Correctifs critiques:**
- Corrige erreur login `Invalid salt` - reinitialisation des comptes admin/test
- Endpoint `POST /api/devices/associate` ne genere plus de fausses donnees (connected=false, battery=0)
- `GET /api/devices` filtre les appareils supprimes
- `GET /api/devices/dashboard-summary` filtre aussi les appareils supprimes (coherence)

**Refactoring page dispositifs (`devices.tsx`):**
- Bouton "Associer" → flux d'appairage guide etape par etape → "Lancer l'appairage" redirige vers la VRAIE page BLE:
  - Bracelet → `/bracelet-connect` (Web Bluetooth / react-native-ble-plx)
  - Gilet Elder → `/vest-connect` (BLE reel)
  - Balance Vita → `/scale-detail` (pesee BLE reelle)
- Bracelet associe : boutons "ECG" (→ `/ecg`) et "Connexion" (→ `/bracelet-connect`)
- Balance associee : bouton "Nouvelle pesee" (→ `/scale-detail`)
- Gilet associe : bouton "Connexion" (→ `/vest-connect`)
- PAS de header collant — le titre scrolle avec le contenu
- Bouton "Supprimer" UNIQUEMENT dans le popup details glass (pas sur la carte)
- Plus aucune donnee simulee — tout passe par le vrai BLE
- Dashboard `DeviceCards.tsx` redirige aussi vers les pages BLE reelles

### Mar 2, 2026 - Correctifs Page Abonnement + Nora + Sante
**Page abonnement (SubscriptionManagePopup):**
- Header affiche le vrai nom du plan du contrat (ex: "Bracelet Elio + Gilet Elder — Teleassistance 24/7")
- Prix correct 79.90€ affiche partout (onglet Info + Paiement)
- Onglet Logement pre-rempli depuis les donnees du contrat (type, etage, porte, code, animal)
- Onglet Gardiens affiche Franck ZUCHIATTI avec statut "En attente"
- Bouton "Moyen de paiement" fonctionne (Stripe billing portal via contract stripe_subscription_id)
- Message resiliation: retour materiel 30 jours + email contact@chutex-innovation.com

**Email resiliation:**
- Inclut retour materiel obligatoire sous 30 jours ouvrables
- Mentionne l'adresse email contact@chutex-innovation.com pour envoyer le suivi

**Nora IA:**
- Regles strictes: ne JAMAIS recommander d'activer le role gardien aux beneficiaires

**Page sante (sans donnees):**
- Page maintenant scrollable (overflow: auto au lieu de hidden)

### Mar 1, 2026 - 10 Programmes de Prevention Scientifiques
**10 programmes complets bases sur des etudes scientifiques:**
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
- Recommandations intelligentes (age, abonnement, appareils)

### Mar 1, 2026 - Fonctionnalites Avancees
- Rapport hebdomadaire email Nora
- Morning Briefing enrichi
- Streaks & Recompenses
- Nora Vocale TTS
- Alertes Predictives
- Mode Intervenant a Domicile
- Invitation equipe programme par telephone

## Upcoming Tasks
- Bouton "Modifier moyen de paiement" sur la page abonnement (non fonctionnel)
- Verification builds mobiles (iOS #60, Android)
- Email rapport hebdomadaire automatise (cron)

## Future/Backlog
- Systeme de parrainage gardien
- Rapport PDF sante partageable
- Programme d'essai gratuit 7 jours
- Integration EBP comptable
- Mode hors-ligne intervenants
- Deploiement production

## Key Files
- `backend/routes/device_routes.py`: Endpoints dispositifs (associate, sync, remove, dashboard-summary)
- `frontend/app/(tabs)/devices.tsx`: Page dispositifs avec flux d'appairage
- `frontend/src/components/dashboard/DeviceCards.tsx`: Cartes dispositifs dashboard
- `backend/services/nora_context.py`: Contexte IA enrichi
- `backend/routes/program_routes.py`: Programmes sante
- `frontend/app/(tabs)/index.tsx`: Dashboard beneficiaire
