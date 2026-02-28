# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB.

## Completed (Feb 28, 2026)
### Popup agence glass full-page
- Popup fond flou scrollable (comme ProfileGlassPopup) au lieu de carte centree
- 3 stats: Gardiens + Prescripteurs + Intervenants

### Onboarding SAAD 2 etapes
- Step 1: Bienvenue + choix commission avec simulation 12 et 24 mois
- Step 2: Stripe Connect
- Backend: PUT /api/company/commission-type

### Simulation 12+24 mois
- Sur 12 mois: 960 EUR (mensuel) vs 1 000 EUR (unique) 
- Sur 24 mois: 1 920 EUR (mensuel) vs 1 000 EUR (unique) avec badge "+920 EUR vs unique"
- Applique sur: onboarding accueil + page profil

### Page profil commission
- Popup glass full-page identique avec choix commission + simulations + Stripe

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (Resend)

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
