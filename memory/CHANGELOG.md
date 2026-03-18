# Chutex Care — CHANGELOG

## [Mars 2026] — ETA Estimation + Carte amelioree

### Ajout
- **Calcul ETA Haversine**: Distance GPS precise entre beneficiaire et intervenant, estimation temps d'arrivee (marche <0.5km, urbain <5km, route >5km)
- **Badge ETA dans header**: Pill bleu cyan avec icone horloge, minutes et km dans le banner compact
- **Badge ETA sur carte**: En haut a droite de la carte avec temps et distance
- **Marqueur intervenant**: Pin vert avec icone runner quand intervention active avec tracking
- **Nettoyage gardiens**: Clement et Julianne retires des gardiens de Josette (reste Claire, Pierre, Marie)

### Tests
- iteration_127.json: 8/8 backend + code review PASS

---

## [Mars 2026] — Carte de localisation temps reel

### Ajout
- Carte CartoDB dark tiles 3x3, marqueurs beneficiaire/intervenant, coordonnees GPS

### Tests
- iteration_126.json: 15/15 backend + frontend 100%

---

## [Mars 2026] — Live Activity Push Notifications

### Ajout
- Systeme Live Status Backend (6 etapes), LiveAlertBanner style Uber Eats
- iOS ActivityKit (Dynamic Island + Lock Screen), push enrichies

### Tests
- iteration_125.json: 11/11 backend + frontend 100%

---

## [Mars 2026] — Admin Dashboard Overhaul + WebSocket Alerts
- Dashboard admin 9 modules, WebSocket alertes, Documents PDF, Brevet V3
- Tests: iteration_121 a 124
