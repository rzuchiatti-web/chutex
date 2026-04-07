# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue complet (7 langues)
- ~460 clés de traduction par langue (FR, EN, DE, ES, IT, PT, NL)
- 37 fichiers utilisent useI18n() — couvre tout le parcours bénéficiaire
- Détection automatique de la locale du device via expo-localization
- Sélecteur de langue dans le header du dashboard (7 drapeaux)
- Pages converties: login, dashboard, santé, activité, sommeil, minceur, profil, chat, exercices, rappels, inscription, abonnement, téléconsultation, briefing matinal, gilet, code lien, fiche bénéficiaire

### Accents français + textes BLE
- 120+ fichiers corrigés pour les accents
- V6→Elio, bouton latéral supprimé, dissocier absent
- Historique sommeil étendu de 7 à 30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB  
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: Centralisé I18nContext.tsx + expo-localization (7 langues, ~460 clés)
