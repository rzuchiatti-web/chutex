# CHUTEX - PRD

## Architecture
- Frontend: Expo Web (React) port 3000
- Backend: FastAPI port 8001
- Database: MongoDB (vitallink_db)
- Auth: JWT (cle `vl_token`)
- LLM: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalites Implementees

### Nora IA — Actions via Chat
- [x] UPDATE_CALORIES, ADJUST_MACROS, ADD_EXERCISE, DELETE_EXERCISE, UPDATE_MEAL_PLAN, LIST_EXERCISES
- [x] Contexte enrichi : exercices du jour + nutrition

### Balance Connectee (Lefu CF586BLE+WIFI)
- [x] Parsing dynamique de TOUTES les metriques Lefu (25+ metriques via API)
- [x] Bug sex=2 corrige (femme=0, homme=1 pour API Lefu)
- [x] Bug variable device non initialisee corrige dans WiFi weighing
- [x] Filtre < 20kg pour rejeter fausses mesures
- [x] Formules BIA locales : 14 metriques sans impedance (BMI, fat%, muscle, os, hydratation, etc.)
- [x] Alias compatibilite backend : fat_mass_kg, muscle_mass_kg, muscle_rate, lean_body_mass, etc.
- [x] WeighingFlow.tsx : timing reduit (10s+10s), 15 metriques affichees, parseur CF586
- [x] Endpoints WiFi : register, weighing, record, config, torre (V2/V3/V4)
- [ ] WiFi non configure : necessite PPBTKitDemo (Android) pour envoyer domaine + WiFi a la balance
- [ ] Impedance BLE : chiffree par hardware Lefu, non exploitable sans WiFi

### Bracelet V8 (JStyle BLE)
- [x] Backend complet : config V8, push endpoint, ECG parser, glucose parser, VO2max, 15 modes sport
- [x] Frontend : bracelet-connect.tsx supporte V8 (detection, connexion, envoi donnees)
- [x] Page ECG reecrite avec vrai flux BLE (commandes 0x32/0x33)
- [x] Connexion BLE fonctionnelle (60+ paquets recus)
- [ ] Protocole V8 : donnees vides (steps=0, hr=0) — besoin SDK fabricant JStyle

### Morning Briefing, Popup Sommeil, Rappels, Dashboard
- [x] Tous les features precedents conserves

## Backlog
- P0 : Obtenir SDK JStyle V8 pour protocole BLE exact
- P0 : Configurer WiFi balance via PPBTKitDemo
- P1 : Implementer protocole V8 reel
- P1 : EAS Build app mobile avec changements frontend
- P2 : Gilet connecte, Parrainage, Essai 7j, Vivoo
- P2 : Refactoring program_routes.py (1866 lignes), teleassistance_routes.py (1131 lignes)
