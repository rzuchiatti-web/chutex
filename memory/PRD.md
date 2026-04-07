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

### Système i18n — Couverture complète (toutes phases)
- **1352+ appels t()** dans l'application
- **~950 clés i18n × 7 langues = ~6650 traductions**
- 3 fichiers de traductions: I18nContext.tsx (base ~490), medicalTranslations.ts (~300), appTranslations.ts (~160)
- **533+ remplacements bulk** via 4 passes de scripts Python dans 70+ fichiers
- GlassTabBar.tsx refactoré avec getTabConfigs(t) + getGuardianTabs(user, t) = **tabs traduits dynamiquement**
- useI18n ajouté à 19+ composants manquants
- Toutes les sections principales traduites: Onboarding, Login, Dashboard, Santé, Profil, Alertes, Dispositifs, Abonnement, Exercices, Sommeil, Activité, Nora, Minceur, Glycémie, Prescriptions, Interventions

### Sessions précédentes
- 120+ fichiers corrigés pour les accents français
- V6 → Elio, bouton latéral supprimé
- Historique sommeil: 7 → 30 jours

## Backlog P2
- Déploiement serveur TCP J2358
- Intégration complète gilet connecté
- Signature Électronique Admin
- Système de parrainage Gardiens
- Flux essai gratuit 7 jours
- Intégration test urinaire Vivoo
