# CHUTEX HEALTH - PRD (Updated Feb 16, 2026)

## Design Direction: "Oura Ring Style" — Dark Premium Health
- Inspiration: Oura Ring app (dark theme, color-coded health cards, score-first, minimal)
- Police: Inter (Google Fonts)
- Fond: Dark (#0D0D0F) avec cards color-coded
- SVG Icons: Inline SVG paths (heroicons-style) via WebIcon.tsx
- Login: HTML pur sur web (clavier fix), glassmorphism + fond pastel
- Violet: uniquement contexte Care

## Architecture icones
- `src/components/WebIcon.tsx` : SVG inline sur web, Ionicons sur natif
- 40+ icones SVG mappees (heroicons paths)
- Utilise `<Icon>` et `<MCIcon>` partout dans l'app

## Feature: Relation Gardien-Beneficiaire
- Liste de relations (Conjoint, Fils/Fille, Ami, Kine, Coach, Patient, Mamie, Papy...)
- Obligatoire avant envoi d'invitation
- Stocke dans collection `guardian_relationships`
- Affiche sur les cartes gardien/beneficiaire

## Login (HTML pur sur web)
- `<form>` + `<input>` natif HTML — zero React Native Web
- Clavier mobile fonctionne correctement
- Fond pastel glassmorphism
- Sur natif iOS: TextInput RN avec refs

## Pages implementees
- Login, Onboarding 5 slides, Dashboard 6 roles, 26 sous-pages
- Toutes converties au systeme de theme (light/dark)
- Icones SVG sur toutes les pages

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## P0 - Prochaine session
- **REFONTE COMPLETE dashboard beneficiaire style Oura Ring**
  - Dark theme #0D0D0F
  - Score circles (Readiness, Sleep, Activity)
  - Color-coded health cards
  - Animations fluides (fade + stagger)
  - Navigation bottom glass dark
  - Sections: Aujourd'hui / Vitals / Ma Sante
- Appliquer le meme design aux autres tabs

## Backlog
- P1: Push TestFlight v2.0
- P1: Deploy backend HDS
- P2: Lefu SDK natif
- P3: J-Style BLE, Shopify
- P4: Mode offline
