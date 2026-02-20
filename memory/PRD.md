# CARE WATCH - PRD

## Original Problem Statement
CARE WATCH is an AI tele-assistance platform for elderly care with multi-role support.

## What's Been Implemented

### Session Feb 20, 2026 — Beneficiary Dashboard & Health Redesign
- **Dashboard beneficiaire refondu** : fond BG_DARK (même que profil), cartes appareils avec vraies images SVG + barres batterie gradient, alerte BG_RED, vitals, SOS, activité/sommeil
- **Section Rappels** : 3 cartes horizontales (Hydratation/Traitement/Alarmes) avec images, popup CRUD glass style (même design que profil), toggles identiques, sélection jours LUNDI-DIMANCHE, feedback "Sauvegardé !"
- **Section Gardiens** : titre blanc, bouton "Ajouter un gardien" blanc pleine largeur avec icône coeur
- **Backend `/api/health/daily-report`** : Score santé /100, statut, analyse IA via LLM (GPT-4.1-mini), corrélations, recommandations, sparklines 7 jours
- **Backend `/api/devices/dashboard-summary`** : Données simulées complètes bracelet + balance + gilet + sommeil
- **Page Santé (health.tsx)** : Redesignée par sections (Bracelet, Balance, Gilet, Sommeil) avec fond BG_DARK

### EN COURS — Page Santé complète (prompt UX détaillé)
- Score santé global + statut sur dashboard ET page santé
- Analyse IA visible (corrélations bracelet+balance)
- Recommandations IA actionnables
- Données centralisées par indicateur (pas par appareil)
- CTA "Nouvelle pesée" avec flow guidé en popup
- Progressive disclosure : résumé → détails → page détail

## Backlog
- P1: Intégrer carte score santé sur dashboard bénéficiaire
- P1: Refonte complète page Santé avec structure UX du prompt
- P2: Flow "Nouvelle pesée" en popup multi-étapes
- P2: Deploy backend permanent
- P3: BLE J-Style bracelet
- P3: Shopify integration
- P4: Offline mode intervenants

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
