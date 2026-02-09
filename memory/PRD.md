# CHUTEX - Product Requirements Document

## Problem Statement
Application de téléassistance intelligente par Chutex Innovation. Monitoring santé connecté, gestion de prescriptions, liaison gardien/bénéficiaire, protocole de téléassistance IA automatisé.

## Tech Stack
- Frontend: React Native (Expo) for Web, TypeScript
- Backend: Python, FastAPI  
- Database: MongoDB
- AI: GPT-5.2 via Emergent LLM Key
- Telephony: Twilio Voice API

## Comptes de test
| Rôle | Email | MdP |
|------|-------|-----|
| Bénéficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Téléassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Features implémentées

### Bénéficiaire
- [x] Dashboard santé (pouls, SpO2, tension, température, pas, stress)
- [x] Bouton SOS → protocole téléassistance automatique
- [x] Seuils d'alerte manuels + recommandation IA par métrique
- [x] Rappels quotidiens (hydratation, médicaments, activités)
- [x] Partage de données sélectif (gardiens)
- [x] Partage QR code / code unique
- [x] Téléconsultation QCM
- [x] Gestion appareils (bracelet, balance, gilet)
- [x] Historique alertes cliquables → détail + Clôturer/Intervenir

### Gardien
- [x] Dashboard bénéficiaires + alertes
- [x] Activation prescripteur proéminente dans onglet Prescriptions + lien chutex-innovation.com
- [x] Activation Intervenant Care dans onglet Interventions
- [x] Fiche détaillée bénéficiaire (santé, appareils + batterie, interventions)
- [x] Alertes cliquables avec options Clôturer/Intervenir
- [x] Rapport santé IA, suivi interventions

### Admin (Bottom tabs dédiés)
- [x] **Dashboard**: Stats globales (utilisateurs, alertes, prescriptions, interventions, etc.)
- [x] **Alertes**: Vue alertes avec détail
- [x] **Prescripteurs**: CRUD complet codes (raison sociale, SIRET, TVA, adresse, téléphone) + toggle actif/inactif + suppression
- [x] **Intervenants**: CRUD complet codes intervenants (infos société, rayon) + toggle + suppression + liste intervenants actifs
- [x] **Analyse**: KPI Dashboard (graphiques alertes/jour, types, utilisateurs, interventions, résolution)
- [x] **Profil**: Infos admin + backoffice complet accessible

### Téléassistance IA
- [x] Dashboard réorganisé avec onglets: En cours, Historique, Interventions
- [x] **Reprise manuelle**: Bouton pour reprendre le contrôle du processus IA
- [x] **Résolution**: Bouton pour résoudre une escalade
- [x] Alertes cliquables → rapport détaillé
- [x] Refresh automatique 5s

### Général
- [x] Branding CHUTEX complet
- [x] Logout fonctionnel
- [x] Vrais noms (Robert Martin, Claire Martin, etc.)
- [x] Seed data automatique

## MOCKED
- Emails stockés en DB (pas SMTP réel)
- Données santé simulées

## Prochaines étapes
- P0: Intégration vrais produits (SDK appareils connectés)  
- P1: Fiche bénéficiaire gardien: toutes données sur une page (pas d'onglets)
- P1: Itinéraire GPS pour se rendre chez le bénéficiaire (non-intervention)
- P1: Service email réel
- P2: Carte multi-bénéficiaires gardien
- P2: Export PDF rapport santé
- P3: Notifications SMS
