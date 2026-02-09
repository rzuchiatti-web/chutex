# VitalLink AI - PRD (Product Requirements Document)

## Vue d'ensemble
Application mobile de santé boostée par l'IA connectant des bénéficiaires (personnes âgées) avec leurs gardiens (famille, professionnels de santé) via des dispositifs de santé connectés.

## Architecture
- **Frontend**: React Native (Expo SDK 54) avec Expo Router
- **Backend**: FastAPI (Python) 
- **Base de données**: MongoDB
- **IA**: OpenAI GPT-5.2 via Emergent LLM Key

## Fonctionnalités MVP

### Espace Bénéficiaire
- Dashboard santé avec constantes vitales (FC, TA, SpO2, Température)
- Bouton SOS pour alertes d'urgence
- Synchronisation des appareils (bracelet, balance, gilet) via Bluetooth simulé
- Recommandations préventives IA personnalisées (GPT-5.2)
- Gestion des médicaments (ajout/suppression avec horaires de prise)
- Historique des alertes

### Espace Gardien
- Vue d'ensemble des bénéficiaires avec indicateurs de santé
- Suivi des alertes en temps réel
- Formulaire de prescription pour nouveaux bénéficiaires
- Suivi des commissions (Standard: 15€, Téléassistance: 25€)
- Liaison bénéficiaire par email

### Système d'authentification
- Inscription/Connexion par email et mot de passe
- JWT avec expiration 72h
- Sélection de rôle (Bénéficiaire/Gardien)

### Dispositifs connectés (simulés)
- **Bracelet Santé**: FC, TA, SpO2, température, pas, calories
- **Balance Connectée**: Poids, IMC, masse grasse, masse musculaire, hydratation
- **Gilet Anti-Chute**: Détection de chute, score posture, niveau d'activité

## API Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Appareils: `/api/devices/sync`, `/api/devices`, `/api/devices/latest`
- Alertes: `/api/alerts`, `/api/alerts/{id}/resolve`
- Médicaments: `/api/medications`, `/api/medications/{id}`
- IA: `/api/ai/recommendations`, `/api/ai/recommendations/latest`
- Gardien: `/api/guardian/link`, `/api/guardian/beneficiaries`, `/api/guardian/prescriptions`
- Admin: `/api/admin/stats`

## Fonctionnalités V2 (implémentées)

### Données de santé détaillées
- 15 métriques bracelet (FC, VFC, stress, VO2Max, SpO2, tension, glycémie, sommeil 4 métriques, température, calories, pas)
- 50+ métriques balance (composition, muscles, hydratation, protéines, métabolisme, segmentation bras/jambes/tronc, évaluation, contrôle)
- Page détail par métrique: graphique 7 jours, moyenne/min/max, plage normale, description, conseil IA, éditeur de seuils

### Téléconsultation 24/7
- QCM de pré-consultation (7 questions: motif, durée, douleur, fièvre, médicaments, allergies, texte libre)
- Numéro d'appel 24/7 après soumission

### Suivi d'interventions
- Création d'intervention depuis une alerte
- Carte interactive Leaflet en temps réel
- Statuts: en route → sur place → terminé
- Rapport d'intervention
- Chronologie des événements

### Back Office
- Statistiques globales (utilisateurs, alertes, prescriptions, interventions, téléconsultations)
- Gestion des utilisateurs
- Gestion des alertes

### Localisation
- 3 modes de partage: Toujours / En cas d'alerte / Jamais
- Configurable par le bénéficiaire

## Fonctionnalités futures
- Notifications push en temps réel
- Intégration Bluetooth réelle avec les dispositifs physiques
- Système de souscription et abonnement en ligne
- Plateau d'écoute IA de téléassistance avec protocole vocal
