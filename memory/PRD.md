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
- Code refactoring complet (teleconsult, index, health)
- **ML V3 Glycemia Estimation** — Gradient Boosting pre-trained on 6000 synthetic samples from medical literature

## ML V3 Glycemia Architecture
- **Level 1 (Population)**: Pre-trained model on medical literature (6000 samples). Works day 1 for all users.
- **Level 2 (Personal)**: Per-user adaptation when 5+ calibrations with sensor snapshots exist.
- **Level 3 (Calibration)**: Optional finger-prick boost for maximum precision.
- **Top features**: HRV normalise (27.2%), risque diabete (24.7%), graisse viscerale (17.7%), ratio muscle/graisse (8.9%)
- **Model**: GradientBoostingRegressor, 300 trees, depth=5, saved at /app/backend/models/

## Current Status
- SOS phone call: WORKING (VAPI.ai keys configured)
- ML Glycemia V3: WORKING (population model, all endpoints tested 100%)
- Sante data: MOCKED (donnees simulees)

## Backlog
See ROADMAP.md for prioritized features.
