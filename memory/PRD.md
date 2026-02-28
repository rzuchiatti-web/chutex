# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - plateforme full-stack React Native (Expo) + FastAPI/MongoDB pour la teleassistance, suivi sante, et gestion SAAD.

## Core Architecture
- **Frontend**: React Native (Expo) for iOS/Android/Web
- **Backend**: FastAPI + MongoDB
- **Payments**: Stripe Connect (multi-entity: Chutex, Chutex Care, SAADs)
- **SMS**: SMSMode for notifications

## Completed Bug Fixes (Feb 28, 2026)
1. **Glass popup** - Toutes les popups utilisent `backdrop-filter: blur(32px)` sur l'overlay (fond flou), identique au pattern ProfileGlassPopup
2. **Commissions SAAD** - Ajout fallback `getCommission()` partout (dashboard, tab prescriptions, detail, cards) → affiche 8EUR/bracelet, 15EUR/bracelet+gilet
3. **Page detail gardien** - Extraction correcte de `response.prescriber` depuis l'endpoint company
4. **Gestion agence/gardien** - Backend retourne `agency_id`/`agency_name` pour chaque gardien
5. **Bouton Message supprime** de la page detail gardien

## Glass Popup Pattern (reference: ProfileGlassPopup)
- **Full-page popups** (create, invite): outer = `backdrop-filter: blur(32px), background: rgba(0,0,0,0.2), overflowY: scroll` / inner = `maxWidth: 400, margin: 0 auto, padding: 40px 28px`
- **Centered popups** (agency detail, Stripe): outer = `backdrop-filter: blur(24px), background: rgba(0,0,0,0.4), flex center` / inner = card `rgba(20,20,30,0.92)`

## Upcoming Tasks (P0)
- Finalize SAAD Onboarding Frontend
- Submit iOS Build 45 to TestFlight

## Test Credentials
| Role | Phone | Password |
|------|-------|----------|
| SAAD | +33477101099 | demo123 |
| Guardian (Robin) | +33651245918 | (user set) |
