# CHUTEX HEALTH - PRD (Updated Feb 16, 2026)

## Design Direction: "Glassmorphism Premium"
- Police: Inter (Google Fonts)
- Login: full-bleed image + glass panel + backdrop-filter blur(20px)
- Light mode par defaut, Dark mode disponible

## Feature: Relation Gardien-Beneficiaire (NEW)
### Description
Lors de l'ajout d'un gardien ou beneficiaire, l'utilisateur doit selectionner QUI il est pour l'autre personne. Cette relation est enregistree et affichee.

### Listes de relations
**Gardien → Beneficiaire:** Conjoint(e), Fils/Fille, Pere/Mere, Frere/Soeur, Petit-fils/Petite-fille, Neveu/Niece, Ami(e) proche, Voisin(e), Aide-soignant(e), Infirmier(ere), Auxiliaire de vie, Kine/Osteopathe, Coach sportif, Preparateur physique, Autre pro sante, Autre

**Beneficiaire → Gardien:** Conjoint(e), Mamie, Papy, Pere/Mere, Fils/Fille, Frere/Soeur, Oncle/Tante, Ami(e), Voisin(e), Patient(e), Autre

### Implementation
- Backend: `relationship` field dans guardian_requests, guardian_invitations, guardian_relationships (collection dediee)
- Frontend: RelationshipPicker (modal bottom sheet) sur la page link-code.tsx
- Champ obligatoire avant envoi d'invitation
- Affichage sur la carte gardien dans le dashboard

## Accounts
| Role | Email | Password |
|---|---|---|
| Beneficiary | robert.martin@email.fr | demo123 |
| Guardian | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |

## Backlog
- P0: Appliquer glassmorphism au dashboard + pages
- P0: Push TestFlight v2.0
- P1: Deploy backend HDS
- P1: Lefu SDK natif
