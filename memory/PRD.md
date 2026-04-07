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

### Système i18n — Couverture complète
- **1352 appels t()** dans l'application
- **~950 clés i18n × 7 langues = ~6650 traductions**
- 3 fichiers de traductions: I18nContext.tsx (base ~490), medicalTranslations.ts (~300), appTranslations.ts (~160)
- **463 remplacements bulk** via scripts Python dans 70+ fichiers
- 20+ fichiers convertis manuellement (health-detail, metric-detail, glycemia-detail, alerts, health, profile, BeneficiaryHome, nora-history, subscriber-detail, activity-detail, exercise-detail, subscription, etc.)
- useI18n ajouté à 19+ composants manquants
- Conditions médicales (14), allergies (8), niveaux activité, textes VO2/récup, descriptions exercices, FAQ alertes, rapports clôture, features abonnement, textes contrat, labels formulaires — tous traduits
- Détection automatique locale (expo-localization)
- Sélecteur 7 drapeaux (FR, EN, DE, ES, IT, PT, NL)
- Build compile 100%

### Reste (module-level, ~26 strings)
- GlassTabBar.tsx : labels tabs (Accueil, Messages, Plus) — nécessite refactoring structurel
- Quelques constantes module-level dans fichiers admin/company

## Backlog P2
- Déploiement serveur TCP J2358
- Intégration complète gilet connecté
- Signature Électronique Admin
- Système de parrainage Gardiens
- Flux essai gratuit 7 jours
- Intégration test urinaire Vivoo
