# CHUTEX - PRD

## Design System
- Noir & blanc, fond beige #F5F0EB + fond pastel CSS, glassmorphisme iOS
- Glass: backdrop-blur(40px), rgba(255,255,255,0.45), border rgba(255,255,255,0.7)
- Boutons noirs pill, uppercase, bold

## Architecture  
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth

## Credentials
- Beneficiaire: robert.martin@email.fr / demo123 (Saint-Chamond)
- Gardien: claire.martin@email.fr / demo123
- Intervenant Care: ludivine.moutio@care.fr / demo123 (Saint-Etienne)
- Admin: admin@chutex.fr / demo123
- Teleassistance: plateau@chutex.fr / demo123

## Session 7 (Feb 13, 2026)
### Accompli
- Switch gardien → beneficiaire (backend + page formulaire + profil)
- Inscription simplifiee (seulement Beneficiaire/Gardien, plus admin/teleassistance)
- Inscription enrichie avec descriptions roles
- Page activate-beneficiary avec formulaire complet 2 etapes
- Health detail: image 3D grande (180px) + carte glass qui chevauche (effet blur)
- Backend: activate-beneficiary, switch-role, update-profile, change-password, contact form
- Selecteur langue FR dans le header
- Bouton supprimer dans fiche gardien
- Images rappels HD (goutte, pilule, reveil fond noir)

## Backlog
- i18n FR/EN complet
- Glassmorphisme ecrans secondaires (backoffice, devices, teleconsult)
- Build natif Android/iOS
- Integration bracelet J-Style / Balance Lefu
