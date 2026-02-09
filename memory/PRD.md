# CHUTEX - Product Requirements Document

## Problem Statement
Application de téléassistance intelligente par Chutex Innovation. Monitoring santé connecté, gestion de prescriptions, liaison gardien/bénéficiaire, protocole de téléassistance IA automatisé via Twilio.

## Tech Stack
- **Frontend**: React Native (Expo) for Web, TypeScript
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM Key
- **Telephony**: Twilio Voice API

## Comptes de test
| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Bénéficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Téléassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Features implémentées

### Bénéficiaire
- [x] Dashboard santé (pouls, SpO2, tension, température, pas, stress)
- [x] Bouton SOS → protocole téléassistance automatique
- [x] Seuils d'alerte manuels + recommandation IA par métrique
- [x] Rappels quotidiens (hydratation, médicaments, activités)
- [x] Partage de données sélectif (gardiens)
- [x] Partage QR code / code unique
- [x] Téléconsultation QCM
- [x] Gestion appareils (bracelet, balance, gilet)
- [x] Historique alertes cliquables → détail alerte

### Gardien
- [x] Dashboard bénéficiaires + alertes
- [x] Fiche détaillée bénéficiaire (santé, appareils + batterie, interventions)
- [x] Activation prescripteur dans l'onglet Prescriptions (code structure)
- [x] Activation Intervenant Care dans l'onglet Interventions
- [x] Lien vers chutex-innovation.com si pas prescripteur
- [x] Alertes cliquables avec options Clôturer/Intervenir
- [x] Rapport santé IA, suivi interventions

### Backoffice Admin
- [x] KPI Dashboard avec graphiques (alertes/jour, types, résolution, utilisateurs)
- [x] Gestion utilisateurs, codes activation, codes intervenants
- [x] Suivi prescriptions + commissions
- [x] Stats globales

### Téléassistance IA
- [x] Dashboard temps réel (refresh 5s)
- [x] Protocole escalade automatique (Twilio)
- [x] Détails alertes avec timeline

### Général
- [x] Branding CHUTEX complet
- [x] Logout fonctionnel (redirect page login)
- [x] Vrais noms français (Robert Martin, Claire Martin, etc.)
- [x] Seed data automatique au démarrage

## MOCKED
- Emails stockés en DB (pas d'envoi SMTP réel)
- Données santé simulées

## Prochaines étapes
- P0: Intégration vrais produits (SDK appareils connectés)
- P1: Service email réel (SendGrid/Resend)
- P1: Backoffice codes avec infos société (raison sociale, TVA, adresse)
- P1: Admin alertes détaillées + menu bottom tabs dédié
- P1: Téléassistance: reprise manuelle du processus IA
- P2: Carte multi-bénéficiaires pour gardien
- P2: Export PDF rapport santé
- P3: Notifications SMS
- P3: Refactoring backend
