# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key)
- Voix: ElevenLabs / Twilio

## Roles (6)
| Role | Description |
|---|---|
| beneficiary | Patient monitore |
| guardian | Proche aidant (peut etre prescripteur + intervenant) |
| admin | Administrateur Chutex |
| teleassistance | Operateur plateau d'ecoute |
| prescriber_company | Entreprise prescriptrice |

## Comptes test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien/Prescripteur | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise SAAD | saad@chutex.fr | demo123 |
| Prescripteurs SAAD | marie.dupont@saad.fr, jean.leroy@saad.fr, sophie.petit@saad.fr, thomas.bernard@saad.fr, julie.moreau@saad.fr, pierre.laurent@saad.fr | demo123 |
| Intervenants SAAD | marc.dubois@saad.fr, isabelle.roux@saad.fr, antoine.garnier@saad.fr + ludivine.moutio@care.fr | demo123 |

## Espace Entreprise - Tabs (6)
1. **Dashboard** : KPIs, commissions, agences, top prescripteurs, filtre date
2. **Agences** : CRUD agences, gestion prescripteurs/intervenants par agence
3. **Prescripteurs** : Liste recherchable, fiche detail cliquable
4. **Intervenants** : Liste recherchable, fiche detail cliquable (missions, rayon, agence)
5. **Activite** : Prescriptions (En cours/Validees) + Interventions (En cours/Terminees)
6. **Profil** : Infos entreprise

## DONE (Feb 14, 2026 - Fork 2, Session 3)
- Gestion intervenants entreprise : nouvel onglet avec liste recherchable, fiche detail
- Gestion interventions entreprise : onglet Activite avec sous-onglets Prescriptions/Interventions
- Backend : /api/company/intervenants, /api/company/intervenant/{id}, /api/company/interventions, /api/company/intervenant/{id}/assign
- Seed : 4 intervenants lies a SAAD (Ludivine, Marc, Isabelle, Antoine) + 4 interventions demo
- Tabs entreprise : Dashboard, Agences, Prescripteurs, Intervenants, Activite, Profil

## DONE (Fork 2, Session 2)
- Redesign fiches prescriptions gardien + interventions gardien + prescriptions entreprise (glassmorphism premium)

## DONE (Fork 2, Session 1)
- Fiche prescripteur cliquable, recherche prescripteurs, UX assignation, filtre date dashboard

## DONE (Fork 1)
- Tous les roles de base, admin complet, CARE WATCH, menu navigation, fiches clients

## Fichiers cles
- frontend/app/(tabs)/_layout.tsx : Menu navigation (6 roles, 6 tabs entreprise)
- frontend/app/(tabs)/index.tsx : Dashboards + filtre date company
- frontend/app/(tabs)/health.tsx : Sante | Clients admin | Agences company
- frontend/app/(tabs)/alerts.tsx : Alertes | Prescripteurs company
- frontend/app/(tabs)/teleconsult.tsx : Interventions gardien | Intervenants admin | **Intervenants company**
- frontend/app/(tabs)/devices.tsx : Appareils | Prescriptions gardien | Prescripteurs admin | **Activite company**
- frontend/app/company-prescriber-detail.tsx : Fiche prescripteur entreprise
- frontend/app/company-intervenant-detail.tsx : **NOUVEAU** Fiche intervenant entreprise
- backend/routes/company_routes.py : API entreprise complete (dashboard, agences, prescripteurs, intervenants, interventions)

## Backlog
- P1 : Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2 : Exports PDF rapports, reporting avance
- P3 : Shopify (bloque plan utilisateur), Balance Lefu, hypnogramme sommeil reel
