# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key)
- Voix: ElevenLabs (multilingual_v2)
- Telephonie: Twilio (appels, speech recognition FR-FR)

## Roles utilisateurs
| Role | Description |
|---|---|
| beneficiary | Beneficiaire - patient monitore |
| guardian | Gardien - proche aidant, peut etre prescripteur/intervenant |
| admin | Administrateur Chutex |
| teleassistance | Operateur plateau d'ecoute |
| prescriber_company | Entreprise prescriptrice (visualisation + agences) |

## Espace Entreprise Prescriptrice (Feb 14, 2026)
- Role `prescriber_company` avec dashboard dedie
- Backend: company_routes.py (5 endpoints: dashboard, CRUD agencies, assign prescriber)
- Test: saad@chutex.fr / demo123 (3 agences, 7 prescripteurs, 14 prescriptions)
- **A CORRIGER (prochain fork):**
  1. Dashboard: redesign performances agences (barres pas comprehensibles)
  2. Agences cliquables: fiche agence avec infos/modifier/supprimer + ajouter prescripteur (ceux avec code entreprise)
  3. Onglet Prescripteurs: affiche alertes au lieu des prescripteurs -> corriger
  4. Onglet Prescriptions: affiche teleconsultations au lieu des prescriptions -> corriger
  5. Profil: enlever switch vers beneficiaire

## Espace Admin (Feb 14, 2026 - DONE)
- 6 onglets: Dashboard KPI, Clients, Alertes, Intervenants, Prescripteurs, Profil
- Dashboard: KPIs colores, graphiques repartition utilisateurs, types alertes, alertes 7j
- Clients: onglets Beneficiaires/Gardiens, users avec has_guardian_space/has_beneficiary_space dans les 2 listes
- Fiches clients contextuelles (viewAs=beneficiary/guardian)
- CRUD codes activation/intervention avec window.confirm sur web

## Espace Gardien (Feb 14, 2026 - DONE)
- Prescriptions: carte prescripteur verte + modal gestion/desactivation + onglets En cours/Validees + total commissions
- Interventions: carte intervenant violette + modal gestion/desactivation + onglets En cours/Terminees
- Fiche beneficiaire: meme design que fiches admin (identite, medical, appareils, localisation, alertes, rapport IA)

## CARE WATCH - Moteur Orchestration (DONE)
- Machine a etats pour escalade alertes vocales
- carewatch_engine.py, carewatch_config.py, carewatch_routes.py

## Comptes de test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien/Prescripteur | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise SAAD | saad@chutex.fr | demo123 |
| Prescripteur SAAD 1 | marie.dupont@saad.fr | demo123 |
| Prescripteur SAAD 2 | jean.leroy@saad.fr | demo123 |
| Prescripteur SAAD 3 | sophie.petit@saad.fr | demo123 |
| Prescripteur SAAD 4 | thomas.bernard@saad.fr | demo123 |
| Prescripteur SAAD 5 | julie.moreau@saad.fr | demo123 |
| Prescripteur SAAD 6 | pierre.laurent@saad.fr | demo123 |

## Fichiers cles
- frontend/app/(tabs)/_layout.tsx: Menu navigation avec gestion 6 roles
- frontend/app/(tabs)/index.tsx: Dashboard (beneficiaire/gardien/admin/teleassistance/company)
- frontend/app/(tabs)/health.tsx: Sante (beneficiaire) / Clients (admin) / Agences (company)
- frontend/app/(tabs)/alerts.tsx: Alertes (tous) / Prescripteurs (company - A CORRIGER)
- frontend/app/(tabs)/teleconsult.tsx: Interventions (gardien) / Intervenants (admin) / Prescriptions (company - A CORRIGER)
- frontend/app/(tabs)/devices.tsx: Appareils (beneficiaire) / Prescriptions (gardien) / Prescripteurs (admin)
- frontend/app/(tabs)/profile.tsx: Profil (tous)
- frontend/app/admin-client-detail.tsx: Fiche client admin contextuelle
- frontend/app/beneficiary-detail.tsx: Fiche beneficiaire gardien
- frontend/app/admin-prescription-detail.tsx: Fiche prescription
- backend/routes/company_routes.py: API entreprise prescriptrice
- backend/routes/admin_routes.py: API admin + backoffice
- backend/routes/auth_routes.py: Auth + switch role + update profile

## Backlog
- P0: Corrections espace entreprise (5 points ci-dessus)
- P1: Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2: Exports PDF, reporting avance
- P3: Shopify (bloque plan), Balance Lefu, hypnogramme sommeil reel
