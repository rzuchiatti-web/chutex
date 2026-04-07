# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Système i18n multilingue complet (7 langues)
- ~50 nouvelles clés de traduction ajoutées pour: FR, EN, DE, ES, IT, PT, NL
- Clés couvrant: dashboard, santé, activité, sommeil, appareils, notifications, alertes, Nora, minceur
- Détection automatique de la locale du device via `expo-localization` (getLocales)
- Sélecteur de langue dans le header du dashboard (7 drapeaux)
- Composants convertis vers t(): BeneficiaryHome, SleepCard, ActivityCard, HealthSections
- Page de connexion entièrement traduite dans les 7 langues

### Correction massive des accents français
- 120+ fichiers modifiés pour les accents (é, è, ê, à, ô, û, ç)
- Suppression textes BLE obsolètes (V6 → Elio, bouton latéral supprimé)
- Historique sommeil étendu de 7 à 30 jours

## Composants i18n convertis
- BeneficiaryHome: Nora card, notifications popup, SOS alerts
- ActivityCard: Steps, Calories, Distance labels
- SleepCard: Sleep/Sommeil label
- HealthSections: 4 sections (Cardiology, Metabolism, Physical condition, Body composition)

## Composants i18n à convertir (backlog)
- SleepAlarmSection, TodayExercisesSection, GuardiansSection, RemindersSection
- activity-detail.tsx, health-detail.tsx (pages complètes)
- profile.tsx, alerts.tsx, chat-ia.tsx

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: Centralisé dans I18nContext.tsx + expo-localization (7 langues)
