# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
- i18n: I18nContext.tsx + medicalTranslations.ts + appTranslations.ts + expo-localization (7 langues, ~1100 clés totales)

## Complété (Avril 2026)

### Système i18n — Couverture complète
- 3 fichiers de traductions: I18nContext.tsx (~490 clés base), medicalTranslations.ts (~300 clés), appTranslations.ts (~120 clés)
- Total: ~910 clés par langue × 7 langues = ~6370 traductions
- Fichiers convertis cette session (Phase 2+3):
  - health-detail.tsx: 25 métriques avec buildSections(t)
  - metric-detail.tsx: 13 RICH_EXPLAIN + mois traduits
  - glycemia-detail.tsx: zones + explications avec buildZones(t) / buildGlycExplanations(t)
  - alerts.tsx: STATE_LABEL, getAlertLabel, ExplainerPage, FAQ, ReportPage
  - health.tsx (onglet): vitals (HR, SpO2, BP, Temperature) labels traduits
  - profile.tsx: notifications (8 types), form labels, CGU, date naissance
  - BeneficiaryHome.tsx: rappels (hydratation/traitement/alarmes), checkin
  - nora-history.tsx: CONTEXT_META traduit avec labelKey
  - subscriber-detail.tsx: labels détails (téléphone, email, adresse, médecin, etc.)
  - activity-detail.tsx: textes récupération VO2, niveaux
  - exercise-detail.tsx: descriptions intensité + avertissement
  - metric-detail.tsx: noms des mois, labels objectifs

### Phase 1 (session précédente)
- 7 langues: FR, EN, DE, ES, IT, PT, NL
- 77 fichiers intégrés initialement (60 pages + 17 composants)
- 418 appels t() + 198 strings bulk-converties
- Détection automatique locale (expo-localization)
- Sélecteur de langue (7 drapeaux)
- Accents français corrigés (120+ fichiers)
- V6 → Elio

## Fichiers restant à convertir (i18n)
- GuardianHome.tsx: labels stats, IBAN, messages
- CompanyHome.tsx: textes admin SAAD
- PrescriptionManagement.tsx: textes prescriptions
- CompanyPrescriptionsTab.tsx: textes prescriptions SAAD
- dorsi-program.tsx / dorsi-game.tsx / dorsi-bilan.tsx: textes Dorsi
- minceur.tsx: labels minceur
- subscription.tsx: features + étapes (clés i18n prêtes, à câbler)
- scale-detail.tsx: textes WiFi/BLE
- backoffice.tsx: textes admin

## Backlog P2
- Déploiement serveur TCP J2358
- Intégration complète gilet connecté
- Signature Électronique Admin
- Système de parrainage Gardiens
- Flux d'essai gratuit 7 jours
- Intégration test urinaire Vivoo
