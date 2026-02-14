# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth

## Roles (6)
| Role | Description |
|---|---|
| beneficiary | Patient monitore |
| guardian | Proche aidant (peut etre prescripteur + intervenant) |
| admin | Administrateur Chutex |
| teleassistance | Operateur plateau d'ecoute |
| prescriber_company | Entreprise prescriptrice |

## Espace Entreprise (DONE - Feb 14, 2026)
- Dashboard: KPIs, commissions validees/attente, performance par agence, top prescripteurs
- Agences: liste avec stats, creation, assignation prescripteurs
- Prescripteurs: liste complete avec agence et commissions
- Prescriptions: onglets En cours/Validees, total commissions, detail modal
- Profil: sans switch beneficiaire
- Test: saad@chutex.fr / demo123

## Comptes test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise | saad@chutex.fr | demo123 |

## Backlog
- P1: Build natif Android/iOS + BLE
- P2: Dashboard entreprise redesign (barres pas claires)
- P2: Agences cliquables (fiche detail/modifier/supprimer)
- P2: Exports PDF
- P3: Shopify, Balance Lefu
