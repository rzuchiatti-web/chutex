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

## DONE (Feb 14, 2026 - Fork 2, Session 2)
- Redesign fiches prescriptions gardien : Modal premium avec fond beige, carte identite avatar+badges, InfoRow pattern, carte commission, section prescripteur
- Redesign cartes interventions gardien : GlassCard borderRadius 22, icones 44x44, badge distance, badge status uppercase, etats vides descriptifs
- Redesign fiches prescriptions entreprise : Meme design premium avec avatar, badges, InfoRow, commission highlight

## DONE (Feb 14, 2026 - Fork 2, Session 1)
- Fiche prescripteur cliquable : /company-prescriber-detail avec identite, stats, agence, prescriptions
- Prescripteurs cliquables partout : dashboard, onglet Prescripteurs (avec recherche), onglet Agences
- UX assignation prescripteur amelioree : bouton toujours visible, retrait possible
- Filtre calendrier dashboard : Tout / 7 jours / 30 jours avec filtrage backend
- Backend : /api/company/prescriber/{id} endpoint + filtrage date

## DONE (Fork 1)
- Bugs P0 : role-switching, backoffice CRUD, suppression codes
- Refonte admin complete : Dashboard KPI, Clients, Alertes, Intervenants, Prescripteurs, Profil
- Espace entreprise prescriptrice : Dashboard, Agences, Prescripteurs, Prescriptions
- Fiches clients admin contextuelles, beneficiaire gardien, prescription admin
- Menu navigation flottant mobile : fix safe-area

## Fichiers cles
- frontend/app/(tabs)/_layout.tsx : Menu navigation (6 roles)
- frontend/app/(tabs)/index.tsx : Dashboards + filtre date company
- frontend/app/(tabs)/health.tsx : Sante | Clients admin | Agences company
- frontend/app/(tabs)/alerts.tsx : Alertes | Prescripteurs company (recherche + cliquable)
- frontend/app/(tabs)/teleconsult.tsx : Interventions (redesign) | Intervenants admin | Prescriptions company (redesign)
- frontend/app/(tabs)/devices.tsx : Appareils | Prescriptions gardien (redesign) | Prescripteurs admin
- frontend/app/(tabs)/profile.tsx : Profil
- frontend/app/company-prescriber-detail.tsx : Fiche prescripteur entreprise
- frontend/app/admin-client-detail.tsx : Fiche client admin (template design)
- backend/routes/company_routes.py : API entreprise complete

## Backlog
- P1 : Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2 : Exports PDF rapports, reporting avance
- P3 : Shopify (bloque plan utilisateur), Balance Lefu, hypnogramme sommeil reel
