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

## DONE (Feb 14, 2026 - Fork 2)
- Fiche prescripteur cliquable : nouvelle page /company-prescriber-detail avec identite, stats, agence, prescriptions (validees + en cours)
- Prescripteurs cliquables partout : dashboard top prescripteurs, onglet Prescripteurs (avec recherche), onglet Agences
- UX assignation prescripteur amelioree : bouton "Gerer les prescripteurs" toujours visible, possibilite de retirer un prescripteur d'une agence
- Filtre calendrier dashboard : boutons Tout / 7 jours / 30 jours avec filtrage backend par date_from/date_to
- Recherche prescripteurs : barre de recherche dans l'onglet Prescripteurs
- Backend : /api/company/prescriber/{id} endpoint + filtrage date sur /api/company/dashboard

## DONE (Fork 1 - Feb 14, 2026)
- Bugs P0 : role-switching (key={effectiveRole}), backoffice CRUD (id fields + window.confirm), suppression codes
- Refonte admin : 6 onglets (Dashboard KPI, Clients, Alertes, Intervenants, Prescripteurs, Profil)
- Fiches clients admin contextuelles (viewAs=beneficiary/guardian)
- Prescriptions gardien : carte verte + onglets En cours/Validees + total commissions + modal detail
- Interventions gardien : carte violette + onglets En cours/Terminees + modal gestion
- Fiche beneficiaire gardien reecrite (style admin)
- Espace entreprise prescriptrice complet : Dashboard, Agences (CRUD + edit/delete + assign prescriber), Prescripteurs, Prescriptions
- Profil : switch masque pour company/admin/teleassistance
- Menu navigation flottant : fix safe-area pour mobile (confirme fonctionnel)

## A FAIRE (P1)

### Design global
1. **Fiches prescriptions gardien** : Redesign des cartes prescription dans l'espace gardien pour matcher le design des fiches client admin
2. **Fiches interventions gardien** : Idem pour les interventions
3. **Uniformiser** : Meme style de fiches detaillees partout dans l'app

## Fichiers cles
- frontend/app/(tabs)/_layout.tsx : Menu navigation (6 roles)
- frontend/app/(tabs)/index.tsx : Dashboards (beneficiary/guardian/admin/teleassistance/company) + filtre date company
- frontend/app/(tabs)/health.tsx : Sante | Clients admin | Agences company (avec gestion prescripteurs amelioree)
- frontend/app/(tabs)/alerts.tsx : Alertes | Prescripteurs company (avec recherche + cliquable)
- frontend/app/(tabs)/teleconsult.tsx : Interventions | Intervenants admin | Prescriptions company
- frontend/app/(tabs)/devices.tsx : Appareils | Prescriptions gardien | Prescripteurs admin
- frontend/app/(tabs)/profile.tsx : Profil (switch masque pour company/admin/ta)
- frontend/app/admin-client-detail.tsx : Fiche client admin contextuelle (viewAs param)
- frontend/app/company-prescriber-detail.tsx : NOUVEAU - Fiche prescripteur entreprise
- frontend/app/beneficiary-detail.tsx : Fiche beneficiaire gardien
- frontend/app/admin-prescription-detail.tsx : Fiche prescription admin
- backend/routes/company_routes.py : API entreprise (dashboard avec filtrage date, prescriber detail, CRUD agencies, assign, delete)
- backend/routes/admin_routes.py : API admin + backoffice + fiches detail

## Backlog (P2/P3)
- P1 : Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P2 : Exports PDF rapports, reporting avance
- P3 : Shopify (bloque plan utilisateur), Balance Lefu, hypnogramme sommeil reel
