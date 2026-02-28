# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB pour la teleassistance, suivi sante, et gestion SAAD.

## Core Architecture
- **Frontend**: React Native (Expo) for iOS/Android/Web
- **Backend**: FastAPI + MongoDB
- **Payments**: Stripe Connect (multi-entity: Chutex, Chutex Care, SAADs)
- **SMS**: SMSMode for notifications

## Key Roles
- **Beneficiary**: elderly person monitored
- **Guardian**: family member/professional watching over beneficiary
- **SAAD (prescriber_company)**: professional structure managing guardians and intervenants
- **Intervenant**: professional who responds to emergencies
- **Admin**: back-office management

## Completed Features
- iOS app crash fixed (New Architecture enabled, Build 45 ready)
- Subscription landing page (/subscription) with multi-step form
- Stripe Connect architecture (subscriptions, invoices, transfers)
- SubscriptionGate component for feature gating
- SAAD/Guardian account creation and linking
- 6-digit prescriber and intervention codes
- Alert management system
- Admin back-office
- Glass-morphism UI throughout SAAD/Guardian spaces

## Completed Bug Fixes (Feb 28, 2026)
1. Glass popup effect - All SAAD popups now use proper glass-morphism (overlay rgba(0,0,0,0.25) + card rgba(15,15,30,0.55) with backdrop-filter blur(40px))
2. Commission display - Added getCommission fallback (8EUR bracelet, 15EUR bracelet+gilet)
3. Guardian detail page - Fixed prescriber data extraction from company endpoint response
4. Agency/Guardian management - Backend returns agency_id and agency_name for guardians
5. Message button removed from guardian detail page

## Upcoming Tasks (P0)
- Finalize SAAD Onboarding Frontend (commission choice popup on first login + Stripe Connect)
- Submit iOS Build 45 to TestFlight

## Upcoming Tasks (P1)
- Email notifications (Resend) for subscription flow
- Full native hardware testing (J-Style bracelet, Lefu Scale, Elder Vest)

## Future Tasks (P2+)
- EBP accounting integration
- Team/group programs UI
- Shopify integration
- Offline mode for intervenants
- Production deployment (Dockerfile, docker-compose)

## Key API Endpoints
- POST /api/auth/login - Login (email field accepts phone)
- GET /api/company/guardians - SAAD guardians with agency info
- GET /api/company/prescriptions - SAAD prescriptions
- GET /api/company/prescriber/{id} - Guardian detail from SAAD view
- GET /api/guardian/saad-link - Guardian's SAAD affiliation info
- POST /api/contract/create-subscription-intent - Stripe subscription
- POST /api/company/stripe-onboarding - Stripe Connect for SAAD

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian | +33651245918 | (user set) |

## Key Files
- backend/routes/company_routes.py - SAAD logic, agencies, guardians
- backend/routes/contract_routes.py - Stripe payments
- frontend/app/company-agency.tsx - Agency management with glass popups
- frontend/src/components/dashboard/CompanyHome.tsx - SAAD dashboard
- frontend/app/guardian-detail.tsx - Guardian detail page
- frontend/src/components/dashboard/GuardianHome.tsx - Guardian dashboard
