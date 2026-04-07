# Chutex Care - PRD

## Problème Original
Application de téléassistance et suivi santé connecté (bracelet Elio V8, balance Vita, gilet Elder). Pipeline BLE temps réel via bridge natif iOS. Zéro mock data.

## Complété cette session (Avril 2026)

### Correction massive des accents français
- 120+ fichiers modifiés pour ajouter les accents manquants (é, è, ê, à, ô, û, ç)
- Pages concernées : login, dashboard, santé, activité, sommeil, profil, admin, abonnements, contrats, CGU, RGPD, téléassistance, appareils, programmes, alertes, inscription
- Correction des noms de variables accidentellement accentués (showCareDetail, AlertDetailWeb, etc.)
- Correction de l'import TeleassistanceHome cassé par le script d'accents

### Suppression textes BLE obsolètes
- "V6" → "Elio" dans tous les textes visibles (useBleConnection.ts, ble.ts)
- "bouton latéral" supprimé des étapes d'appairage (DeviceCards.tsx)
- "dissocier" confirmé absent
- Étape corrigée : "Posez le bracelet Elio sur son socle puis retirez-le"

### Amélioration historique sommeil
- Endpoint /api/health/sleep/history étendu de 7 à 30 jours

## Session précédente (complété)
- Refonte page Santé (cartes grises HealthSections)
- Popups avec marge 70px + boutons ronds
- Titres exercices centrés
- Bug done_today corrigé
- Données corrompues an 9734 purgées
- Pouls temps réel (badge bpm)
- Jeux Dorsi améliorés visuellement
- Streak Minceur (flamme)
- Builds 134/136 TestFlight

## En attente de vérification utilisateur
- Page santé cartes grises
- Popups BLE simplifiées
- Exercice validé sur dashboard
- Gilet Sx-sairbag connexion
- Données sommeil (timezone/durée)
- Contexte Nora IA avec sleep_data

## Architecture
- Frontend: React Native / Expo (WebView iOS)
- Backend: FastAPI + MongoDB
- BLE: Bridge natif iOS (bleV8Bridge.ts)
- IA: OpenAI GPT-5.2 via Emergent LLM Key (Nora)
