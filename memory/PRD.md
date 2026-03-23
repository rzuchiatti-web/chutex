# Chutex Care — PRD

## Core Design Language
- Header: fond rouge abstrait, texte toujours blanc, scrollable, z-index derriere contenu
- Carte contenu: coins arrondis haut, z-index devant, dark gradient ou blanc pur
- Dark: gradient #000→#3A3A3C, cartes rgba(70,70,78,0.85)
- Light: fond #FFF, cartes #E8E8EA, texte #1A1A2E, cartes phases #F2F2F4
- Page Santé: header rouge, contenu thémé
- FullScreenLoader z-index 99999
- Titres sur images hero: TOUJOURS blancs (#FFF) avec text-shadow
- Theme reactif: localStorage polling 400ms via useState+useEffect dans TOUTES les pages

## Completed Features
- Beneficiary Dashboard redesign (Light/Dark mode)
- Health Page redesign
- Programs & Profile Page redesign
- Guardian Dashboard UI overhaul
- Fixed z-index issues (React portals)
- Removed navbar text labels (icons only)
- Navbar hidden on Subscription detail popup (CSS injection)
- Subscription tabs refactor: Care = 3 tabs (Abonnement+Contrat+Paiement fusionnés, Logement, Gardiens), Standard = pas d'onglets
- ProgramPresentation light mode fix: titres blancs sur hero, cartes lisibles (#F2F2F4 bg, #1A1A2E text)
- Theme reactif sans rechargement sur Santé et Programmes (polling localStorage)

## Backlog
- P0: Balance & Vest integration
- P1: Signature electronique (Admin → Documents)
- P2: Parrainage Gardien, Essai 7 jours, PDF Contrat, Vivoo
- Refactoring: profile.tsx (1000+ lignes) à découper, backend routes monolithiques

## Credentials
| Role | Login | Password |
|------|-------|----------|
| Admin | 0600000001 | admin123 |
| Beneficiaire | 0651245918 | test123 |
| Gardien | +33699887766 | test123 |
