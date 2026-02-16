# CHUTEX HEALTH - PRD (Updated Feb 16, 2026)

## Design Direction: "Clinical Futurist Premium"
- DA finale: Noir profond (#000) / Blanc / Gris clinique premium
- Violet (#7C5CFF) UNIQUEMENT pour contexte Care (teleassistance)
- Glass cards: rgba(255,255,255,0.03) + border rgba(255,255,255,0.10) + radius 22px
- Coins HUD sur les cartes critiques
- Scanline douce, grille 64x64, vignette radiale
- Boutons capsule blancs avec scan/ripple subtil
- Typographie: Inter, system-ui - poids 800 pour titres, espacement negatif
- Logos: /app/frontend/assets/images/logo_black.png + logo_white.png

## Redesign Status: PHASE 1 COMPLETE
- Design System (colors.ts): DONE - Full dark tokens
- Background (PastelMistBackground.tsx): DONE - Grid + noise + vignette
- Onboarding (5 slides): DONE - Products, Data, Care(violet), Video, Security
- Login page: DONE - Dark clinical glass card
- Tab Layout: DONE - Dark floating glass nav
- Dashboard (all 6 roles): DONE - Dark theme applied
- All 30+ sub-pages: DONE - Bulk dark theme conversion
- Profile page: DONE - Dark inputs and cards
- Components (HelpSystem, FloatingNav): DONE

## Onboarding (NEW)
- 5 slides obligatoires a la 1ere ouverture
- Slide 1: Ecosysteme (Elder/Elio/Vita) avec cartes HUD
- Slide 2: Donnees & Prevention (FC, SpO2, Temp, Glycemie)
- Slide 3: Teleassistance Care (SEUL slide avec violet)
- Slide 4: Teleconsultation 24/7 (video cockpit HUD)
- Slide 5: Securite + CTA "Commencer" / "Activer Care plus tard"

## Features (all working)
- Push Notifications (9 categories + preferences UI)
- BLE Scale (CF597_GNLine, QN-Scale protocol)
- UX Help Layer (PageExplainers, MiniTutos)
- Smart Alert Dispatch + Uber Tracking
- 6 user roles with full dashboards
- Onboarding flow with 5 clinical slides

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Prescriber Company | saad@chutex.fr | demo123 |

## Backlog
- P1: Deploy backend on HDS server
- P1: Lefu SDK native (awaiting lefu.config)
- P2: Build natif + integration BLE bracelet J-Style
- P3: Shopify, WebSocket
- P4: Mode hors-ligne intervenants

## Known Limitations
- Expo web icons render as boxes (known Expo web limitation)
- AsyncStorage resets on full page reload in preview environment
- Lefu scale BLE data parsing incomplete (weight fix deployed, 30+ metrics pending)
- Native app requires permanent backend URL for production
