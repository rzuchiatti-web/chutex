# CARE WATCH — Product Requirements Document

## Original Problem Statement
AI tele-assistance platform "CARE WATCH" with B2B portal, AI alert dispatch, push notifications, and multi-role dashboards (6 roles).

## Design Direction: Ultra-Premium Soft-Glass
Soft glassmorphism + subtle neumorphism, light neutral, warm gradient accents.

### Design Tokens
| Token | Value |
|-------|-------|
| Background | #F5F6F8 |
| Surface | #FFFFFF |
| Glass | rgba(255,255,255,0.72) blur(12px) saturate(120%) |
| Text Primary | #1E1F24 (dark charcoal) |
| Text Secondary | #6B7084 (cool gray) |
| Text Muted | #9CA3B0 |
| Accent | #D4845A (peach-orange) |
| Accent Light | #E8A87C |
| Accent Peach | #F5CBA7 |
| Card Large Radius | 24px |
| Card Small Radius | 20px |
| Pill Radius | 999px |
| Shadow Default | 0 10px 30px rgba(20,20,30,.08) |
| Shadow Hover | 0 16px 40px rgba(20,20,30,.12) |
| Care Violet | #7C5CFF |

### Animations
- Page enter: fade + translateY(12px), 380ms, ease-out
- Card stagger: 55ms per item
- Hero gradient: gradientDrift 12s infinite
- Hover: scale(1.012) + stronger shadow
- Press: scale(0.98)
- Tab bar: glass blur entrance 500ms
- Halo glow: 5s pulsing radial gradient behind headers

### Component Specs
- **Cards**: 24px radius, 1px border rgba(20,20,30,.06), soft shadow
- **Buttons**: Dark gradient pill (linear-gradient #1E1F24→#2D2E34), warm gradient pill
- **Quick Actions**: 56x56 circular, 20px radius, colored tinted backgrounds
- **Tab Bar**: Floating glass, blur(20px) saturate(140%), 28px radius, 64px height
- **Hero Sections**: Warm gradient with gradientDrift, glass vitals insets
- **Doctor Card**: Gradient strip top, glass avatar area, dark arrow CTA

## What's Implemented (Feb 2026)
- [x] Ultra-premium soft-glass design system
- [x] All 6 role dashboards with role-specific hero gradients
- [x] Login page with animated halo, soft gradient hero, glass form
- [x] Floating glass tab bar with blur effect
- [x] CSS animations (pageEnter, gradientDrift, haloGlow, sosPulse)
- [x] Premium teleconsult doctor card with gradient strip
- [x] Quick actions with circular soft-raised icons
- [x] All detail pages updated with new color palette
- [x] Profile page with warm accent menu items
- [x] SOS button with pulse animation and red shadow
- [x] Guardian/beneficiary relationship feature
- [x] Safari keyboard bug fix (pure HTML login)

## Known Issues
1. Lefu Scale BLE Data Parsing (P1)
2. Native App Backend Connectivity (P2)
3. iOS Build Process (P3)

## Upcoming Tasks
- P1: Deploy backend to permanent host
- P2: BLE Integration J-Style bracelet
- P3: Shopify Integration
- P4: Offline Mode

## Tech Stack
- Frontend: React Native / Expo Router / React Native Web
- Backend: FastAPI / Python / MongoDB
- Integrations: OpenAI (Emergent LLM Key), Expo EAS
