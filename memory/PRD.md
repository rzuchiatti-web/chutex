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
- 1352+ appels t(), ~950 clés × 7 langues = ~6650 traductions
- 3 fichiers de traductions: I18nContext.tsx (~490), medicalTranslations.ts (~300), appTranslations.ts (~160)
- 533+ remplacements bulk via scripts Python dans 70+ fichiers
- GlassTabBar.tsx refactoré avec getTabConfigs(t) — tabs traduits dynamiquement
- useI18n ajouté à 19+ composants
- Détection automatique locale (expo-localization) + sélecteur 7 drapeaux

### Intégrations connectées (déjà opérationnelles)
- Bracelet Elio V8 : BLE temps réel, vitals, sommeil, activité
- Balance Vita : pesée 8 électrodes, composition corporelle
- Gilet Elder : connexion BLE, détection chute airbag, posture, température thoracique
- IA Nora : GPT-5.2, analyses santé, briefing matinal

### Historique
- Accents français corrigés (120+ fichiers)
- V6 → Elio, bouton latéral supprimé
- Historique sommeil: 7 → 30 jours

## Issues connues
- Bracelet date BCD 2017 (hardware, TIME_SYNC inefficace)

## Backlog
- P1 : Flux d'essai gratuit de 30 jours pour les bénéficiaires
- P2 : Déploiement serveur TCP J2358
- P2 : Intégration test urinaire Vivoo
