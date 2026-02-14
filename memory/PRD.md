# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth

## Roles utilisateurs
| Role | Description |
|---|---|
| beneficiary | Beneficiaire - patient monitore |
| guardian | Gardien - proche aidant, peut etre prescripteur/intervenant |
| admin | Administrateur Chutex |
| teleassistance | Operateur plateau d'ecoute |
| prescriber_company | Entreprise prescriptrice (visualisation + agences) |

## Espace Entreprise Prescriptrice (NEW - Feb 14, 2026)
- Nouveau role `prescriber_company` avec dashboard dedie
- Gestion d'agences (CRUD) + assignation prescripteurs aux agences
- Dashboard KPI : prescripteurs, prescriptions, commissions validees/attente
- Performance par agence (graphiques barres empilees)
- Top prescripteurs (classement)
- Backend: company_routes.py avec 5 endpoints
- Test: saad@chutex.fr / demo123 (3 agences, 7 prescripteurs, 14 prescriptions)

## Comptes de test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien/Prescripteur | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise | saad@chutex.fr | demo123 |

## Backlog
- P1: Build natif Android/iOS + BLE
- P2: Exports PDF, reporting avance
- P3: Shopify, Balance Lefu
