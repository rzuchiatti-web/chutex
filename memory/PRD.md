# Chutex Care - PRD

## Probleme original
Application de sante preventive "Chutex Care" - plateforme complete avec React Native (Expo) frontend, FastAPI backend, MongoDB. Gestion des alertes, surveillance sante, integration materiel BLE, back-office admin.

## Architecture
- **Frontend**: React Native / Expo (expo-router, file-based routing)
- **Backend**: FastAPI + MongoDB
- **Integrations**: Vapi.ai (voice), SMS Mode (SMS), OpenAI GPT-4o (AI)
- **Build**: EAS (Expo Application Services) pour iOS/Android

## Utilisateurs
| Role | Description |
|------|-------------|
| Beneficiaire | Porte les dispositifs de sante |
| Gardien | Aidant/professionnel accompagnant un beneficiaire |
| SAAD | Dirigeant de structure d'aide a domicile |
| Admin | Gestion complete du systeme |
| Teleassistance | Operateur d'appels d'urgence |

## Ce qui a ete implemente
- Admin Back-Office complet (tabs: Dashboard, Utilisateurs, Alertes, Donnees, Systeme)
- Systeme d'alertes avec Vapi.ai et SMS Mode
- Inscription multi-etapes (Beneficiaire, Gardien, SAAD)
- Page de detail d'alerte riche
- Generation automatique de codes d'activation pour SAAD
- Build iOS TestFlight

## Refactoring (25 Feb 2026)
Decomposition de 3 fichiers volumineux en composants modulaires :

### register.tsx (626 -> 147 lignes, -76%)
Extrait en 9 composants dans `src/components/register/`:
- RegisterUI.tsx (types partagees, GI, Chip, YesNoToggle, etc.)
- RoleSelection.tsx (etape 0)
- RGPDStep.tsx (etape 1)
- PhonePasswordStep.tsx (etape 2 - beneficiaire/gardien)
- SAADStep.tsx (etape 2 - SAAD)
- BeneficiaryInfoStep.tsx (etape 3 - beneficiaire)
- MedicalStep.tsx (etape 4 - beneficiaire)
- AntecedentsStep.tsx (etape 5 - beneficiaire)
- GuardianInfoStep.tsx (etape 3 - gardien)

### AdminHome.tsx (242 -> 107 lignes, -56%)
Extrait en 7 composants dans `src/components/admin/`:
- AdminUI.tsx (Card, Badge, Pill, Table, InfoRow, SH)
- DashboardTab.tsx
- UsersTab.tsx
- AlertsTab.tsx
- DataTab.tsx
- SystemTab.tsx
- UserDetailModal.tsx

### alert-detail.tsx (317 -> 157 lignes, -50%)
Extrait en 7 composants dans `src/components/alert/`:
- MapEmbed.tsx
- VitalsGrid.tsx
- BeneficiaryCard.tsx
- GuardiansCard.tsx
- IntervenantCard.tsx
- AlertTimeline.tsx
- ReportModal.tsx

## Problemes connus
- **P0 iOS Crash**: Build 4 TestFlight en attente de verification utilisateur
- **P1 Vapi.ai**: Appels internationaux bloques (plan gratuit)
- **P2 Lefu Scale**: Parsing BLE incorrect (bloque par crash iOS)

## Backlog
- P1: Tests materiel natif (bracelet, balance, gilet)
- P2: Audit i18n complet
- P3: Page abonnement SAAD
- UI programmes d'equipe/groupe
- Integration Shopify
- Mode hors-ligne intervenants
- Fichiers deploiement production (Dockerfile, docker-compose)

## Comptes de test
| Role | Telephone | Mot de passe |
|------|-----------|-------------|
| Admin | +33600000001 | demo123 |
| Teleassistance | +33477101011 | demo123 |
| SAAD (test) | +33612345678 | demo123 |
