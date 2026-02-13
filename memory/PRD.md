# CHUTEX - Teleassistance & Telesante Application

## Problem Statement
Application de teleassistance et telesante "CHUTEX" pour le suivi des personnes agees/vulnerables avec 4 roles.

## Design System
- **Palette**: Noir & Blanc, fond beige (#F5F0EB), glassmorphisme iOS
- **Glass**: backdrop-blur(40px), rgba(255,255,255,0.45), inset box-shadow
- **Boutons**: Noirs pill, uppercase, bold
- **Categories sante**: Cardiaque, Sanguine, Sommeil, Physique (illustrations 3D)
- **Rappels**: Hydratation (goutte), Traitements (pilule), Alarmes (reveil)

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth

## Session 5-6 (Feb 12-13, 2026) - REDESIGN + ESCALATION

### Accompli
- Redesign complet noir & blanc glassmorphisme iOS
- Dashboard beneficiaire/gardien/admin/teleassistance
- Page rappels: 3 categories avec illustrations 3D
- Cleanup alertes: 1617 → 3
- **Escalation Intervenant Care**: quand aucun gardien ne repond, le systeme trouve l'Intervenant Care le plus proche par geolocalisation et lui dispatche l'intervention
  - Robert Martin: Saint-Chamond (45.4737, 4.5134)
  - Ludivine Moutio (Intervenant Care): Saint-Etienne (45.4397, 4.3872) - 14.5km
  - Calcul distance + rayon d'intervention (30km)
  
### Credentials
- Beneficiaire: robert.martin@email.fr / demo123
- Gardien: claire.martin@email.fr / demo123
- Admin: admin@chutex.fr / demo123
- Teleassistance: plateau@chutex.fr / demo123
- Intervenant Care: ludivine.moutio@care.fr / demo123

## Backlog
- P1: Flow invitation gardien frontend
- P2: Pages detail sante avec graphiques 7 jours + seuils d'alertes
- P2: Glassmorphisme ecrans secondaires restants
- P3: Build natif Android/iOS
- P3: Integration bracelet J-Style / Balance Lefu
