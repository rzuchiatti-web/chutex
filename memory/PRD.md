# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" - plateforme complete avec React Native (Expo) frontend, FastAPI backend, MongoDB. Gestion des alertes, surveillance sante, integration materiel BLE, back-office admin.

## Architecture
- Frontend: React Native (Expo) avec expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- Hebergement preview: Emergent Platform (Kubernetes)

## Fonctionnalites implementees
- Flux d'authentification complet (onboarding, login, register)
- LanguagePicker reusable sur tout le flux auth
- Verification SMS lors de l'inscription
- Login biometrique (Face ID/empreinte) - natif uniquement
- Back-office admin refactore
- Systeme d'alertes redesigne (Vapi.ai + SMS Mode)
- Gestion des roles (Beneficiaire, Gardien, SAAD, Admin, Teleassistance)
- Chat IA avec OpenAI GPT-4o
- Pages RGPD / Protection des donnees
- Images compressees pour les roles (beneficiaire + gardien)

## Comptes de test
| Role | Phone | Password |
|---|---|---|
| Admin | 600000001 | demo123 |
| Teleassistance | 477101011 | demo123 |
| SAAD (test) | 612345678 | demo123 |

## Statut actuel
- Verification UI auth flow: COMPLETE (Feb 2026)
- Build iOS: BLOQUE (quota Expo)
- Vapi.ai international: BLOQUE (plan gratuit)
- Lefu Scale BLE: BLOQUE (crash iOS)

## Taches a venir (priorite)
1. P0: Continuer checkup page par page (retours utilisateur)
2. P1: Audit i18n complet
3. P2: Page abonnement SAAD
4. P3: Tests materiel natif complet

## Backlog
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production (Dockerfile, docker-compose)

## Integrations tierces
- Vapi.ai (appels vocaux IA)
- SMS Mode (notifications SMS)
- Expo EAS Build (builds natifs)
- expo-local-authentication (biometrie)
- OpenAI GPT-4o (analyse IA) via Emergent LLM Key
- Materiel: Lefu Smart Scale, J-Style bracelet, Elder S-AIRBAG vest
