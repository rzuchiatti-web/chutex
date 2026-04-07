# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: I18nContext.tsx + medicalTranslations.ts + appTranslations.ts + expo-localization (7 langues)

## Complété (Avril 2026)

### Système i18n — Couverture massive (Phase 1+2+3)
- Total: ~910 clés i18n × 7 langues = ~6370 traductions
- 3 fichiers de traductions: I18nContext.tsx (base ~490 clés), medicalTranslations.ts (~300 clés), appTranslations.ts (~120 clés)
- +305 remplacements bulk via script Python (labels, boutons, statuts) dans 70+ fichiers
- Fichiers convertis manuellement: health-detail, metric-detail, glycemia-detail, alerts, health, profile, BeneficiaryHome, nora-history, subscriber-detail, activity-detail, exercise-detail
- Détection automatique locale (expo-localization)
- Sélecteur 7 drapeaux
- Build compile 100%, app fonctionnelle

### Accents français + textes BLE (sessions précédentes)
- 120+ fichiers corrigés pour les accents
- V6 → Elio, bouton latéral supprimé
- Historique sommeil: 7 → 30 jours

## Issues connues
- Bracelet date BCD 2017 (hardware, TIME_SYNC inefficace)
- GlassTabBar.tsx: labels en français dur (module-level, non-translatable sans refactoring)

## Backlog P2
- Déploiement serveur TCP J2358
- Intégration complète gilet connecté
- Signature Électronique Admin
- Système de parrainage Gardiens
- Flux essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Refactoring: rendre GlassTabBar dynamique avec i18n
