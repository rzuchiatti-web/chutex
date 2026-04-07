# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue complet (7 langues)
- ~85 clés de traduction en 7 langues: FR, EN, DE, ES, IT, PT, NL
- Détection automatique de la locale du device via `expo-localization` (getLocales)
- Sélecteur de langue dans le header du dashboard (7 drapeaux)
- Composants convertis vers t():
  - Dashboard: BeneficiaryHome, ActivityCard, SleepCard, HealthSections
  - Sections: SleepAlarmSection, TodayExercisesSection, RemindersSection
  - Pages: activity-detail.tsx, health-detail.tsx, minceur.tsx
- Clés couvrant: dashboard, santé, activité, sommeil, appareils, notifications, alertes, Nora, minceur, jours/mois

### Correction massive des accents français
- 120+ fichiers modifiés pour les accents
- Suppression textes BLE obsolètes (V6 → Elio, bouton latéral supprimé)
- Historique sommeil étendu de 7 à 30 jours

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: Centralisé dans I18nContext.tsx + expo-localization (7 langues)

## Backlog i18n restant
- profile.tsx, alerts.tsx, chat-ia.tsx, beneficiary-detail.tsx
- DeviceCards (strings internes appairage)
- Pages admin (backoffice, admin-client-detail)
