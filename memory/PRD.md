# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB pour la teleassistance, suivi sante, et gestion SAAD.

## Completed Features (Feb 28, 2026)

### Onboarding SAAD (NEW)
- Popup glass 2 etapes au premier login SAAD (quand `commission_type` non defini)
- **Step 1**: Bienvenue + choix commission (oneshot 100/200EUR vs mensuelle 8/15EUR) avec simulation financiere
- **Step 2**: Connexion Stripe Connect pour recevoir les paiements
- Backend: `PUT /api/company/commission-type` sauvegarde le choix sans Stripe
- Le choix est modifiable depuis la page profil

### Bug Fixes (Feb 28, 2026)
1. Glass popup avec backdrop-filter blur(32px) sur overlay
2. Commissions affichees correctement (fallback getCommission: 8EUR bracelet, 15EUR bracelet+gilet)
3. Page detail gardien corrigee (extraction response.prescriber)
4. Agency/guardian management avec agency_id/agency_name
5. Bouton Message supprime du detail gardien

## Upcoming Tasks
- P0: Soumettre iOS Build 45 sur TestFlight
- P1: Notifications email (Resend)
- P2: Tests hardware natifs

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
