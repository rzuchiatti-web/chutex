# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue complet (7 langues)
- ~95 clés de traduction en 7 langues: FR, EN, DE, ES, IT, PT, NL
- Détection automatique de la locale du device via `expo-localization`
- Sélecteur de langue dans le header du dashboard (7 drapeaux)
- Composants/pages convertis vers t():
  - Dashboard: BeneficiaryHome, ActivityCard, SleepCard, HealthSections
  - Sections: SleepAlarmSection, TodayExercisesSection, RemindersSection
  - Pages: activity-detail, health-detail, minceur, profile (labels/alertes), chat (équipe), beneficiary-detail
- 120+ fichiers: accents français corrigés
- Textes BLE: V6→Elio, bouton latéral supprimé
- Historique sommeil: 7→30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: Centralisé I18nContext.tsx + expo-localization (7 langues)
