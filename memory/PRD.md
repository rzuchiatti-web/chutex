# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue — 100% couvert
- 7 langues: FR, EN, DE, ES, IT, PT, NL
- ~490 clés de traduction par langue
- 77 fichiers intégrés (60 pages + 17 composants)
- 418 appels t() dans les pages app
- 0 page manquante (hors system files)
- 198 strings bulk-converties (titres, boutons, labels communs)
- Détection automatique locale device (expo-localization)
- Sélecteur de langue dans le header dashboard (7 drapeaux)

### Accents français + textes BLE
- 120+ fichiers corrigés pour les accents
- V6→Elio, bouton latéral supprimé
- Historique sommeil: 7→30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: I18nContext.tsx + expo-localization (7 langues, ~490 clés, 77 fichiers)
