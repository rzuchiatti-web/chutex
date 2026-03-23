# Chutex Care — PRD

## Core Design Language
- Header: fond rouge abstrait, texte toujours blanc, scrollable, z-index derriere contenu
- Dark: gradient #000→#3A3A3C, cartes rgba(70,70,78,0.85)
- Light: fond #FFF, cartes #E8E8EA, texte #1A1A2E, cartes phases #F2F2F4
- Titres sur images hero: TOUJOURS blancs (#FFF) avec text-shadow
- Theme reactif: localStorage polling 400ms dans TOUTES les pages
- Teleconsult: navbar dark, titre + pilule "Medecin disponible 24/7"

## Completed Features
- Dashboards Beneficiaire/Gardien redesign (Light/Dark)
- Pages Sante, Programmes, Profil redesign
- Z-index fixes (React portals), Navbar icons only
- Subscription popup: navbar masquee, 3 onglets Care (icone seule inactive, icone+label active)
- Contrat: visionneuse in-app en lecture seule (8 articles, conditions generales)
- Program detail pages refactored avec isDark prop (Onboarding, Ready, Invite, Pill)
- isDark reactif partout (health, chat, program-detail)
- Teleconsult: titre + pilule + navbar dark + ajout dans navbar beneficiaire

## Backlog
- P0: Balance & Vest integration
- P1: Signature electronique (Admin → Documents)
- P2: Parrainage Gardien, Essai 7 jours, Vivoo
- Refactoring: profile.tsx (1000+ lignes), backend routes monolithiques

## Credentials
| Role | Login | Password |
|------|-------|----------|
| Admin | 0600000001 | admin123 |
| Beneficiaire | 0651245918 | test123 |
| Gardien | +33699887766 | test123 |
