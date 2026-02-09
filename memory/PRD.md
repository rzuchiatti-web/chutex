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
- [x] **ECG** — Lancement depuis l'app, résultat simulé (BPM, rythme, intervalles PR/QRS/QT, tracé, interprétation), historique
- [x] **Géofencing** — Zones de sécurité avec rayon, alerte auto si sortie de zone
- [x] **Alertes de sédentarité** — Config max heures inactif + plages horaires, alerte auto

### Gardien
- [x] Dashboard bénéficiaires + alertes
- [x] Activation prescripteur + Intervention Care
- [x] Fiche détaillée bénéficiaire (santé, appareils + batterie, interventions)
- [x] Alertes cliquables avec Clôturer/Intervenir
- [x] Rapport santé IA, suivi interventions

### Admin (6 bottom tabs)
- [x] Dashboard, Alertes, Prescripteurs (CRUD codes + infos société), Intervenants (CRUD codes), Analyse (KPI), Profil

### Téléassistance IA
- [x] Dashboard (En cours / Historique / Interventions), reprise manuelle, résolution
- [x] Refresh auto 5s, alertes cliquables

## MOCKED
- ECG simulé (PQRST waveform)
- Géofencing utilise position stockée
- Emails en DB
- Données santé simulées

## Prochaines étapes
- P1: Fiche bénéficiaire gardien: toutes données sur une page
- P1: Bouton itinéraire GPS (Google Maps/Waze)
- P1: Carte multi-bénéficiaires gardien
- P1: Service email réel
- P2: Export PDF rapport santé
- P3: Notifications SMS
- P3: Intégration vrais produits SDK
