# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue complet
- 7 langues: FR, EN, DE, ES, IT, PT, NL
- ~460 clés de traduction par langue, toutes langues alignées
- 77 fichiers intégrés au système i18n (60 pages app + 17 composants)
- 100% des pages utilisateur converties (0 pages manquantes hors system files)
- Détection automatique de la locale du device via expo-localization
- Sélecteur de langue dans le header du dashboard (7 drapeaux)

### Accents français + textes BLE
- 120+ fichiers corrigés pour les accents (é, è, ê, à, ô, û, ç)
- V6→Elio, bouton latéral supprimé, dissocier absent
- Historique sommeil étendu de 7 à 30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: I18nContext.tsx + expo-localization (7 langues, ~460 clés, 77 fichiers)
