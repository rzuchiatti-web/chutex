# VitalLink - Product Requirements Document

## Problem Statement
Application de monitoring santé et téléassistance automatisée. Permet le suivi de données de santé simulées, la gestion de prescriptions, la liaison gardien/bénéficiaire, et un protocole de téléassistance entièrement automatisé via Twilio.

## Tech Stack
- **Frontend**: React Native (Expo) for Web, TypeScript
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM Key (recommendations, health reports)
- **Telephony**: Twilio Voice API (real automated calls)

## User Roles & Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Bénéficiaire | demo@vitallink.fr | demo123 |
| Gardien | guardian@vitallink.fr | demo123 |
| Téléassistance | teleassist@vitallink.fr | demo123 |
| Admin | admin@vitallink.fr | demo123 |

## Core Features - IMPLEMENTED

### Bénéficiaire
- [x] Dashboard santé avec constantes clés (pouls, SpO2, tension, température, pas, stress)
- [x] Bouton SOS déclenchant le protocole de téléassistance automatique
- [x] Seuils d'alerte manuels par métrique (min/max/objectif)
- [x] Recommandations IA personnalisées (GPT-5.2)
- [x] Historique graphique 7 jours par métrique
- [x] **Rappels quotidiens** (hydratation, médicaments, activités) - NEW
- [x] **Partage de données sélectif** (choisir quoi partager aux gardiens) - NEW
- [x] Partage QR code / code unique aux gardiens
- [x] Téléconsultation QCM (7 questions)
- [x] Gestion appareils (sync bracelet, balance, gilet)
- [x] Historique des alertes avec filtre

### Gardien
- [x] Dashboard avec liste bénéficiaires + alertes
- [x] Fiche détaillée bénéficiaire (santé, infos médicales, alertes)
- [x] **Onglet Appareils** avec niveaux de batterie - NEW
- [x] **Onglet Interventions** dans le détail bénéficiaire - NEW
- [x] Rapport santé IA complet
- [x] Suivi interventions avec carte
- [x] Espace prescription (si code prescripteur activé)
- [x] Activation intervenant via code
- [x] Commission + date versement 1er du mois suivant

### Backoffice Admin
- [x] Stats globales (utilisateurs, alertes, prescriptions, interventions)
- [x] **Tableau de bord KPI** avec graphiques (alertes/jour, types, résolution, interventions) - NEW
- [x] Liste utilisateurs + codes activation
- [x] Gestion codes intervenants avec rayon
- [x] Suivi prescriptions + commissions
- [x] **Emails envoyés** visibles (collection sent_emails) - NEW

### Téléassistance
- [x] Dashboard temps réel (refresh 5s)
- [x] Protocole d'escalade automatique (bénéficiaire → gardiens → dispatch)
- [x] Appels Twilio réels automatisés
- [x] Historique escalades + détails appels
- [x] **Rapport d'alerte enrichi** avec timeline unifiée - NEW

## Architecture
```
Frontend: React Native (Expo) - Port 3000
Backend: FastAPI - Port 8001
Database: MongoDB (localhost:27017, DB: vitallink_db)
```

## Key Screens
- Auth (login/register)
- Home dashboard (role-specific)
- Health data (bracelet/scale tabs)
- Alerts (with test triggers)
- Devices (sync simulation)
- Profile (with role-specific features)
- Backoffice (admin only, with KPI tab)
- Beneficiary detail (guardian view with devices + battery)
- Alert detail (with escalation tracking + timeline)
- Intervention detail (UberEats-style tracking)
- Link code (QR sharing)
- **Reminders** (hydration, medication, activities) - NEW
- **Data sharing** (toggle what to share) - NEW

## Mocked Features
- Email sending (stored in DB, not sent via SMTP)
- Health data (simulated via device sync)

## API Endpoints (NEW in this session)
- POST/GET /api/reminders - CRUD rappels
- PUT /api/reminders/{id}/complete - Marquer rappel fait
- PUT /api/reminders/{id}/toggle - Activer/désactiver
- DELETE /api/reminders/{id} - Supprimer
- GET/PUT /api/settings/data-sharing - Préférences partage
- GET /api/guardian/beneficiaries/map - Carte gardien
- GET /api/backoffice/kpi - Données KPI dashboard
- GET /api/alerts/{id}/report - Rapport alerte enrichi
- GET /api/emails - Emails envoyés (admin)

## Future/Backlog
- P1: Intégrer un vrai service d'email (SendGrid/Resend)
- P1: Carte multi-bénéficiaires interactive pour le gardien
- P2: Export PDF rapport de santé
- P2: Navigation GPS pour intervenant
- P3: Notifications SMS
- P3: Backend refactoring (split server.py en modules)
