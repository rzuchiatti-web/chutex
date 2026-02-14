# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key)
- Voix: ElevenLabs (multilingual_v2)
- Telephonie: Twilio (appels, speech recognition FR-FR)

## Espace Admin Refonte (DONE - Feb 14, 2026)
### Navigation admin dediee (5 onglets)
1. **Dashboard** - KPIs, graphiques repartition utilisateurs, types alertes, alertes/7j, temps resolution
2. **Alertes** - Toutes alertes (onglets Actives/Resolues) enrichies CARE WATCH
3. **Intervenants** - Onglets: Codes CRUD / Intervenants actifs / Missions interventions
4. **Prescripteurs** - Onglets: Codes CRUD / Prescripteurs actifs / Souscriptions
5. **Clients** - Onglets: Beneficiaires / Gardiens (liste complete avec infos)

### Icones menu admin
- Dashboard: stats-chart-outline
- Alertes: warning-outline
- Intervenants: medkit-outline
- Prescripteurs: document-text-outline
- Clients: people-outline

## Corrections Bug Suppression (DONE - Feb 14, 2026)
- Alert.alert avec boutons ne fonctionne pas sur React Native Web
- Fix: window.confirm() directement sur web via helper confirmAction()
- Applique dans: backoffice.tsx, teleconsult.tsx, devices.tsx

## CARE WATCH - Moteur Orchestration (DONE)
- Machine a etats: NEW_ALERT -> CALLING_PATIENT -> PATIENT_OK/NEEDS_HELP/NO_RESPONSE -> CALLING_GUARDIAN_1/2/N -> GUARDIAN_ACCEPTED/UNREACHABLE -> CARE_DISPATCHED -> RESOLVED

## Comptes de test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P1: Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2: Reporting avance
- P3: Shopify (bloque sur plan utilisateur), Balance Lefu
- P3: Hypnogramme sommeil avec donnees reelles
