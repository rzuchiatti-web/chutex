# Chutex Care — PRD

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes.

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) + MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud, GPT-5.2

## Dashboard Beneficiaire — Design Final (Mars 2026)

### Structure
- **Header FIXE** : fond rouge abstrait, avatar + nom + icones (theme toggle, notif, drapeau) — texte toujours blanc
- **Banniere alertes** : glass overlay sur fond rouge, texte blanc, "5 | Alertes | Active >"
- **Carte contenu scrollable** : coins arrondis en haut (24px), chevauche le header
- **Gradient** : noir pur (#000) en haut → gris fonce (#3A3A3C) en bas (dark) / blanc → beige (light)
- **Carte "Objectifs journalier"** : noir pur, video Nora + play button
- **4 cartes objectifs** (ordre fixe) : Pas, Hydratation, Endormissement, Apport calorique
  - Images 3D : physique.png, hydratation.png, sommeil.png, kcal_icon.svg
  - Barre segmentee (4 segments) pour Pas + pourcentage a DROITE des barres
  - Separateur vertical entre valeur et label
- **Mode light/dark** : toggle dans header, persistance localStorage, navbar adapte

### Fichiers cles
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`
- `/app/frontend/src/components/dashboard/DailyObjectives.tsx`
- `/app/frontend/src/components/dashboard/AlertBanner.tsx`
- `/app/frontend/src/components/GlassTabBar.tsx`

## Backlog
### P0 — Finaliser integration Balance & Vest
### P1 — Signature electronique (Documents admin)
### P2 — Parrainage Guardian, essai gratuit 7j, PDF contrats, Vivoo, refactoring backend

## Credentials
| Role | Email/Phone | Password |
| :--- | :--- | :--- |
| Admin | 0600000001 | admin123 |
| Beneficiaire (Josette) | 0651245918 | test123 |
| Gardien (Marie) | +33699887766 | test123 |
