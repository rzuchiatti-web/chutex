# CHUTEX - PRD

## Design System
- Noir & blanc, fond beige #F5F0EB + fond pastel CSS, glassmorphisme iOS
- Boutons noirs pill, uppercase, bold
- Images 3D medicales (coeur, sang, lune, thermometre)

## Architecture  
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- i18n: FR, EN, DE, ES, IT (I18nContext)

## Session 8 (Feb 13, 2026)
### Accompli
- i18n complet 5 langues (FR/EN/DE/ES/IT) avec I18nProvider
- Tab labels dynamiques selon la langue
- Selecteur langue avec drapeaux dans le profil (persiste AsyncStorage)
- Drapeau actif dans le header dashboard
- Seuils d'alertes fonctionnels (sauvegarde + rechargement backend)
- Suppression rappels fonctionnelle (confirmation modal custom, pas Alert.alert)
- Image sante 220px avec chevauchement glass
- Calendrier inline sur le graphique
- Analyse IA par metrique
- Switch bidirectionnel gardien/beneficiaire
- Inscription simplifiee (seulement benef/gardien)

## Backlog
- Glassmorphisme ecrans secondaires (devices, teleconsult, backoffice)
- Animation switch profil dans la carte dashboard
- Build natif Android/iOS
- Integration bracelet J-Style / Balance Lefu
