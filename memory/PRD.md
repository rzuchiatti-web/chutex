# ChuteX - PRD (Product Requirements Document)

## Original Problem Statement
Application de monitoring de santé full-stack avec espaces séparés pour "Bénéficiaires" et "Gardiens". L'application utilise un style premium dark mode inspiré de Whoop, avec un fond animé mesh gradient et des cartes sombres solides.

## Architecture
- **Frontend**: React Native / Expo (web + mobile)
- **Backend**: FastAPI + MongoDB
- **Style**: Dark mode Whoop-style forcé, fond animé, cartes solides
- **3rd Party**: OpenAI GPT-5.2 (Emergent LLM Key), Lefu Cloud API, Mollie, VAPI.ai, Mailjet, SMSMode

## What's Been Implemented

### Session actuelle (17 mars 2026)
- **P0 Guardian Dashboard UI** : COMPLETE
  - Ajout de séparateurs visuels entre sections (alertes -> bénéficiaires, bénéficiaires -> Nora)
  - Mise en valeur de la carte Nora (CopilotCard) avec bordure 1.5px blanche et ombre renforcée
  - Fichiers modifiés: `GuardianHome.tsx`, `CopilotCard.tsx`

### Sessions précédentes
- **"Whoop-Style" Dark Mode Overhaul**: AnimatedDarkBg, cartes solides sombres, dark mode forcé
- **Navbar Fixes**: Liens corrigés dans WhoopTabBar
- **Guardian Page Crash Fix**: `glass is not defined` résolu
- **Beneficiary Detail Card**: Restructurée (Identity, Address, Physical, Medical)
- **Dashboard Layout**: Objectifs quotidiens en colonne unique, bouton "Add Device" dans header
- **Program Page**: Filtres supprimés, popup instructionnel ajouté
- **CAHIER_DES_CHARGES.md**: Résumé complet des fonctionnalités

## Prioritized Backlog

### P1
- True ML pour l'estimation de la glycémie (V3)

### P2
- Système de parrainage Guardian
- Essai gratuit de 7 jours
- Visualisation du contrat PDF
- Intégration test urinaire Vivoo
- UI des corrélations de santé
- Documentation technique brevet algorithme glucose

### Refactoring
- Simplification de WhoopTabBar.tsx (gère 2 rôles)

## Mocked Data
- Biological Age (simulé)
- Glycemia Estimation (simulé)
- Sleep Data (simulé)

## Test Credentials
| Role | Phone | Password |
|---|---|---|
| Beneficiary | 0651245918 | test123 |
| Guardian (Marie) | +33699887766 | test123 |
