# Chutex Care — CHANGELOG

## [Mars 2026] — Algorithme Age Biologique V2 (3 niveaux scientifiques)

### Ajout
- **Niveau 1 — Bracelet seul**: Scoring pondéré HRV (30%), FC repos (20%), sommeil (15%), pas (15%), SpO2 (10%), stress (10%) — basé sur Klemera-Doubal simplifié
- **Niveau 2 — Bracelet + Balance**: Ajoute graisse viscérale (20%), masse musculaire (15%), graisse corporelle (10%), IMC (5%), hydratation (3%) — normes ACE/Janssen
- **Niveau 3 — Tendances temporelles**: Analyse 90 jours, première/deuxième moitié comparison, direction amélioration/dégradation, ajustement rate ±0.04
- **Normes de référence OMS/AHA**: HRV, FC, graisse corporelle, masse musculaire par tranche d'âge (30-39 à 80+) et sexe (M/F)
- **Score composite 0-100**: Moyenne pondérée des biomarqueurs normalisés, conversion en offset âge bio (50 = âge exact, ±10 = ±2 ans)
- **Niveaux de confiance**: Haute (>60 lectures + >=6 biomarqueurs), Moyenne (>20 + >=3), Basse (sinon)
- **Fusion Nora IA**: 60% Nora AI + 40% algorithme quand les deux disponibles
- **Frontend badges**: Niveau (Bracelet seul / Bracelet + Balance), Confiance, Tendance dans HeroScore

### Tests
- iteration_128.json: 15/15 backend + code review PASS

---

## [Mars 2026] — ETA Estimation + Carte amelioree
- Calcul Haversine + estimation arrivée, badges ETA header + carte, marqueur intervenant
- Tests: iteration_127

## [Mars 2026] — Live Activity + Carte temps reel  
- LiveAlertBanner style Uber Eats, CartoDB dark tiles, iOS ActivityKit
- Tests: iteration_125-126

## [Mars 2026] — Admin Dashboard Overhaul + WebSocket Alerts
- Dashboard admin 9 modules, WebSocket, Documents PDF, Brevet V3
- Tests: iteration_121-124
