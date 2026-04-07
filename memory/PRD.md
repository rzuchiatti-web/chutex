# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue (7 langues)
- ~50 nouvelles clés de traduction ajoutées dans I18nContext.tsx
- Traductions complètes pour: FR, EN, DE, ES, IT, PT, NL
- Clés couvrant: dashboard, santé, activité, sommeil, appareils, notifications, alertes, Nora
- Conversion des strings hardcodées du dashboard (BeneficiaryHome) vers t()
- Conversion de SleepCard vers t()
- Sélecteur de langue dans le header du dashboard (7 drapeaux)
- Page de connexion entièrement traduite

### Correction massive des accents français (session précédente continuée)
- 120+ fichiers modifiés pour les accents (é, è, ê, à, ô, û, ç)
- Correction des noms de variables accidentellement accentués
- Correction de l'import TeleassistanceHome

### Suppression textes BLE obsolètes
- "V6" → "Elio", "bouton latéral" supprimé, "dissocier" absent
- Historique sommeil étendu de 7 à 30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: Centralisé dans I18nContext.tsx (7 langues)
