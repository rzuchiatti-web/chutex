# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: I18nContext.tsx + medicalTranslations.ts + expo-localization (7 langues, ~790 clés totales, 77+ fichiers)

## Complété (Avril 2026)

### Système i18n multilingue — Phase 1 (session précédente)
- 7 langues: FR, EN, DE, ES, IT, PT, NL
- ~490 clés de traduction par langue (base)
- 77 fichiers intégrés (60 pages + 17 composants)
- 418 appels t() dans les pages app
- 198 strings bulk-converties (titres, boutons, labels communs)
- Détection automatique locale device (expo-localization)
- Sélecteur de langue dans le header dashboard (7 drapeaux)

### Système i18n — Phase 2 : Textes médicaux longs (cette session)
- Fichier `medicalTranslations.ts` créé (~300 clés par langue, 7 langues)
- health-detail.tsx : 25 métriques (labels + explications) traduits via `buildSections(t)`
- metric-detail.tsx : 13 RICH_EXPLAIN (desc/why/tip/source + range labels) traduits
- glycemia-detail.tsx : 5 zones + 3 explications complètes traduites via `buildZones(t)` / `buildGlycExplanations(t)`
- alerts.tsx : STATE_LABEL, getAlertLabel, ExplainerPage (steps/roles/FAQ), ReportPage (questions/options) — tous traduits
- subscription.tsx : 7 features, textes formulaire, étapes confirmation — clés i18n prêtes
- profile.tsx : 6 descriptions notifications, features abonnement — clés i18n prêtes
- Merge automatique `_BASE` + `medicalT` dans I18nContext.tsx

### Accents français + textes BLE (session précédente)
- 120+ fichiers corrigés pour les accents
- V6 → Elio, bouton latéral supprimé
- Historique sommeil: 7 → 30 jours

## Issues connues
- Bracelet date BCD 2017 (hardware, TIME_SYNC inefficace)
- Historique sommeil : 1 seule nuit en base (données réelles, pas un bug code)

## Backlog P2
- Déploiement serveur TCP J2358
- Intégration complète gilet connecté
- Signature Électronique documents Admin
- Système de parrainage Gardiens
- Flux d'essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Splitter I18nContext.tsx en fichiers JSON séparés (refactoring maintenabilité)
- Convertir les textes restants du dashboard (minceur, caloric intake) en i18n
