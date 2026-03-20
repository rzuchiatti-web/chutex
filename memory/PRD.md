# Chutex Care — PRD

## Architecture
- Frontend: React Native (Expo) - Web + Mobile
- Backend: FastAPI (Python) + MongoDB

## Dashboard Beneficiaire — Design Final

### Structure
- Header SCROLLABLE (pas fixe), coins arrondis en bas (24px), fond rouge abstrait
- Texte header/alertes toujours blanc (sur fond rouge)
- Carte contenu: coins arrondis en haut, gradient noir→gris fonce (dark) / #D8D5D0 solide (light)
- Carte "Objectifs journalier": noir pur #000 + lueur haut-gauche (dark ET light)
- 4 cartes objectifs: Pas (barre segmentee + % a droite), Hydratation, Endormissement, Apport calorique
- Images: physique.png, hydratation.png, sommeil.png, kcal_icon.svg
- Dark: cartes rgba(70,70,78,0.85), Light: cartes #F5F5F5
- Bouton "Ajouter gardien": rond noir+icon blanc (light) / transparent+blanc (dark)
- FullScreenLoader z-index 99999 masque la navbar

### Fichiers
- BeneficiaryHome.tsx, DailyObjectives.tsx, AlertBanner.tsx, GlassTabBar.tsx, FullScreenLoader.tsx

## Backlog
- P0: Finaliser Balance & Vest
- P1: Signature electronique Documents admin
- P2: Parrainage, essai 7j, PDF, Vivoo, refactoring

## Credentials
| Role | Phone | Password |
|---|---|---|
| Admin | 0600000001 | admin123 |
| Beneficiaire | 0651245918 | test123 |
| Gardien | +33699887766 | test123 |
