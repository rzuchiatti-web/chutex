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

## Current Status
- SOS phone call: WORKING (VAPI.ai keys configured)
- Sante data: MOCKED (donnees simulees)

## Refactoring Status
| File | Before | After | Reduction |
|------|--------|-------|-----------|
| teleconsult.tsx | 1942 | 104 | 95% |
| index.tsx | 1073 | 23 | 98% |
| health.tsx | 433 | 386 | 11% |

## Backlog
See ROADMAP.md for prioritized features.
