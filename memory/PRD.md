# Chutex Care — PRD

## Problem Statement
Application mobile & web de monitoring sante pour seniors, avec teleassistance, gestion de gardiens, interventions Care, programmes de sante, et suivi de donnees biometriques.

## Core Requirements
- Authentication multi-role (beneficiaire, gardien, admin, teleassistance, company)
- Dashboard sante (poids, glycemie, activite, ECG)
- Alertes SOS + teleassistance IA (VAPI.ai)
- Gestion des interventions Care (intervenants)
- Programmes de sante en equipe
- Chat IA (GPT-5.2)
- Bracelets connectes (Lefu Cloud, V6)
- Prescriptions et abonnements (Mollie)

## Architecture
- Frontend: Expo / React Native Web
- Backend: FastAPI + MongoDB
- ML: scikit-learn GradientBoostingRegressor (glycemia V3)
- Integrations: OpenAI (Emergent LLM), VAPI.ai, Twilio, Mollie, Mailjet, SMSMode

## What's Been Implemented
- Full auth system (multi-role, switch role)
- Dashboard sante complet
- Alertes SOS + teleassistance IA (VAPI.ai FONCTIONNEL)
- Gestion interventions Care
- Programmes de sante en equipe (join via invite code)
- Chat IA (GPT-5.2)
- UI premium (images IA, glassmorphism)
- Performance optimisations (batch API, caching)
- Code refactoring complet (teleconsult, index, health, program-detail)
- **ML V3 Glycemia Estimation** — Gradient Boosting pre-trained on 6000 synthetic samples
- **Patent Documentation V3** — Complete 742-line technical patent specification

## ML V3 Glycemia Architecture
- **Level 1 (Population)**: Pre-trained model on medical literature (6000 samples). Works day 1 for all users.
- **Level 2 (Personal)**: Per-user adaptation when 5+ calibrations with sensor snapshots exist.
- **Level 3 (Calibration)**: Optional finger-prick boost for maximum precision.
- **Top features**: HRV normalise (27.2%), risque diabete (24.7%), graisse viscerale (17.7%), ratio muscle/graisse (8.9%)
- **Model**: GradientBoostingRegressor, 300 trees, depth=5, saved at /app/backend/models/

## Refactoring Status
- teleconsult.tsx: DONE (1942 -> 104 lines, 7 sub-components)
- index.tsx: DONE (1073 -> 23 lines, DailyObjectives + BeneficiaryHome)
- sante.tsx: DONE (GlycemiaCard extracted)
- program-detail.tsx: DONE (605 -> 154 lines, 5 sub-components: ProgramPresentation, ProgramOnboarding, ProgramInvite, ProgramReady, ProgramPill)
- WhoopTabBar.tsx: PENDING (low priority)

## Current Status
- SOS phone call: WORKING (VAPI.ai keys configured)
- ML Glycemia V3: WORKING (population model, all endpoints tested 100%)
- Sante data: MOCKED (donnees simulees)
- Patent V3: COMPLETE (742 lines, /app/memory/PATENT_GLYCEMIA_V3.md)

## Admin Dashboard Full Overhaul (March 2026)
Complete rebuild of admin backoffice with sidebar navigation and 9 modules:
1. **Tableau de bord** — KPI cards (users, alerts, subs, interventions), charts (alerts 7j, interventions 6 mois), role distribution, alert types
2. **Utilisateurs** — Search bar, 5 role filters, 18-user table, detailed user modal (contact, medical, devices, alerts, guardians)
3. **Alertes & SOS** — 4 KPIs, 3 views (active/history/interventions), timeline, status badges
4. **Appareils** — 5 KPIs (total/bracelets/scales/connected/low battery), device cards per type
5. **Sante** — Beneficiary health table (FC, HRV, SpO2, Pas, Glycemie, Zone, Confiance)
6. **Contrats** — 5 sub-tabs (Abonnements, Prescriptions, SAAD, RGPD, Emails), CRUD
7. **Programmes** — Enrollment table with progress bars, status, mode
8. **Documents** — Patent docs (V1/V2/V3 with FINAL badge), PDF export, other tech docs
9. **Configuration** — Activation/intervention codes, Shopify sync, system info
- Admin credentials: phone 0600000001, password admin123
- Backend: /api/admin/devices-overview, /api/admin/health-overview (new endpoints)

## Real-Time WebSocket Alerts (March 2026)
- WebSocket endpoint: /api/ws/admin-alerts?token=JWT
- AdminWSManager: manages connections, broadcasts new alerts
- Frontend: auto-connects on admin login, green dot status indicator
- Live alert toasts: shake animation, auto-dismiss 12s, click to navigate to alerts page
- Broadcast hook: asyncio.create_task(admin_ws.broadcast_alert(alert)) in alert creation
- Fully tested: JWT validation, non-admin rejection (4003), broadcast delivery

## Backlog
See ROADMAP.md for prioritized features.
