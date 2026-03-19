# Chutex Care — CHANGELOG

## [Mars 2026] — Dashboard Beneficiaire Design Clinique

### Modifie
- **BeneficiaryHome.tsx**: Redesign complet inspire de myhealthprac.com
- **Video background**: Mixkit fractal tunnel geometrique (31562-720.mp4) — abstrait/minimaliste
- **Overlay sombre**: gradient rgba(2,2,8) de 0.45 a 0.6 pour contraste clinique
- **Cartes glass**: rgba(8,8,16,0.6) — plus opaques et structurees
- **Bordures blanches fines**: `rgba(255,255,255,0.12)` sur tous les elements
- **Coins nets**: 14px border-radius (au lieu de 18-22px) pour esthetique clinique
- **Blur renforce**: 24px backdrop-filter pour profondeur
- **Video background**: filtre `brightness(0.75) saturate(0.85)`
- **Nettoyage isDark**: suppression des ternaires isDark inutilises dans le web-block

---

## [Fevrier 2026] — Correlations Sante

### Ajout
- **Endpoint `/api/health/correlations`**: Analyse Pearson sur 90 jours entre 19 paires de metriques
- **Agregation quotidienne**: Fusion bracelet + balance par jour pour correlations fiables
- **4 niveaux de force**: faible (<0.25), moderee (<0.50), forte (<0.75), tres_forte (>=0.75)
- **Insights AI**: 3 conseils medicaux personnalises via GPT-5.2 (Nora IA)
- **Fallback**: Insights generes automatiquement si API AI indisponible
- **UI CorrelationsCard**: Composant integre sur la page sante avec barres visuelles, insights AI, expand/collapse

- **Endpoint `/api/health/correlations/trends`**: Evolution hebdomadaire sur 8 semaines glissantes
- **Direction tendances**: Renforce (>+10%), Stable, Affaibli (<-10%) avec sparklines inline
- **UI CorrelationsCard**: Design simplifie pour le grand public — phrases en francais simple ("Bien dormir calme votre coeur"), icones 38x38 comme HeroScore, tendances inline, sans termes techniques

### Tests
- iteration_130.json: 18/18 backend tests PASS (correlations + regression)
- iteration_131.json: 11/11 frontend tests PASS (CorrelationsCard v1)
- iteration_132.json: 18/18 backend+frontend tests PASS (trends endpoint + tabs UI)
- iteration_133.json: 7/7 frontend tests PASS (redesign simplifie)

---

## [Fevrier 2026] — Refactoring Backend Sante

### Modifie
- **Split `health_report_routes.py`**: 2222 lignes → 4 modules (aging, sleep, thresholds, report)
- **Suppression code mort**: 15 composants frontend supprimes
- **`GlassTabBar.tsx`**: Extraction du WhoopTabBar dans composant generique

### Tests
- iteration_129.json: 32/32 regression tests PASS

---

## [Mars 2026] — Algorithme Age Biologique V2 (3 niveaux scientifiques)

### Ajout
- **Niveau 1 — Bracelet seul**: Scoring pondere HRV (30%), FC repos (20%), sommeil (15%), pas (15%), SpO2 (10%), stress (10%)
- **Niveau 2 — Bracelet + Balance**: Ajoute graisse viscerale (20%), masse musculaire (15%), graisse corporelle (10%), IMC (5%), hydratation (3%)
- **Niveau 3 — Tendances temporelles**: Analyse 90 jours, direction amelioration/degradation, ajustement rate +-0.04
- **Normes de reference OMS/AHA**: HRV, FC, graisse corporelle, masse musculaire par tranche d'age et sexe
- **Score composite 0-100**: Conversion en offset age bio
- **Niveaux de confiance**: Haute/Moyenne/Basse
- **Fusion Nora IA**: 60% Nora AI + 40% algorithme

### Tests
- iteration_128.json: 15/15 backend + code review PASS

---

## [Mars 2026] — ETA Estimation + Carte amelioree
- Calcul Haversine + estimation arrivee, badges ETA header + carte, marqueur intervenant
- Tests: iteration_127

## [Mars 2026] — Live Activity + Carte temps reel
- LiveAlertBanner style Uber Eats, CartoDB dark tiles, iOS ActivityKit
- Tests: iteration_125-126

## [Mars 2026] — Admin Dashboard Overhaul + WebSocket Alerts
- Dashboard admin 9 modules, WebSocket, Documents PDF, Brevet V3
- Tests: iteration_121-124
