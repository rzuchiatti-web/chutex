# Chutex Care — PRD (Product Requirements Document)

## Enonce du probleme
Chutex Care est une plateforme de teleassistance et de sante connectee pour les personnes agees et dependantes.

## Architecture technique
- **Frontend**: React Native (Expo) - Web + Mobile
- **Backend**: FastAPI (Python) + MongoDB
- **Integrations**: VAPI.ai, Twilio, ElevenLabs, Mollie, Mailjet, SMSMode, Lefu Cloud, GPT-5.2

## Fonctionnalites implementees

### Dashboard Beneficiaire - Redesign complet (Mars 2026)
- **Fond rouge abstrait** en haut de page couvrant header + alert, transition vers couleur solide
- **Header sans carte glass** : nom, avatar, icones directement sur le fond rouge
- **Toggle theme light/dark** dans le header (soleil/lune), persistance via localStorage
- Mode Dark : fond #2C2C2E, cartes rgba(70,70,78,0.85), texte blanc
- Mode Light : fond #F5F2EE, cartes rgba(255,255,255,0.88), texte sombre
- **Banniere alertes** : glass effect sur fond rouge, "5 | Alertes | Active >"
- **Carte "Objectifs journalier"** sombre avec video Nora et play button
- **4 cartes objectifs** dans l'ordre : Pas, Hydratation, Endormissement, Apport calorique
  - Images 3D correctes : physique.png, hydratation.png, sommeil.png, kcal_icon.svg
  - Barre de progression segmentee (4 segments) pour les Pas
  - Separateur vertical entre valeur et label
- CopilotCard (Nora separee) supprimee
- GlassTabBar s'adapte automatiquement au theme
- SOS fonctionnel (garde en backend, masque sur le dashboard visuel)

### Bracelet V8 JStyle (Fevrier 2026)
- Connexion BLE Web Bluetooth (JStyle SDK V8: 0xFFF0 service)
- Push data types: heart_rate, spo2, temperature, steps, blood_pressure, ecg, blood_glucose, ppg
- Mode simulation V8 complet

### Correlations Sante (Fevrier 2026)
- Endpoint `/api/health/correlations` et `/api/health/correlations/trends`
- 19 paires de metriques, Pearson sur 90 jours

### Age Biologique V2 (Mars 2026)
- Algorithme 3 niveaux: L1 bracelet, L2 bracelet+balance, L3 tendances

## Backlog

### P0
- Finaliser integration Balance & Vest

### P1
- Systeme de signature electronique (Documents admin)

### P2
- Parrainage Guardian, essai gratuit 7j, PDF contrats, Vivoo, refactoring backend

## Fichiers cles
- `/app/frontend/src/components/dashboard/BeneficiaryHome.tsx`
- `/app/frontend/src/components/dashboard/DailyObjectives.tsx`
- `/app/frontend/src/components/dashboard/AlertBanner.tsx`
- `/app/frontend/src/components/GlassTabBar.tsx`
- `/app/frontend/src/components/dashboard/constants.ts`

## Credentials de test
| Role | Email / Phone | Password |
| :--- | :--- | :--- |
| **Admin** | `0600000001` | `admin123` |
| **Beneficiaire (Josette)** | `0651245918` | `test123` |
| **Gardien (Marie)** | `+33699887766` | `test123` |
