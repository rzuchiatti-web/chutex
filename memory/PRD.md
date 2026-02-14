# CHUTEX / CARE WATCH - PRD

## Protocole CARE WATCH
- Cas 1 (Sans Care) : Alerte -> Gardiens notifies -> J'INTERVIENS -> Suivi carte
- Cas 2 (Care + gardien) : Alerte -> IA appelle patient -> Gardiens -> Gardien intervient
- Cas 3 (Care + SAAD) : Alerte -> IA -> Gardiens injoignables -> Dispatch SAAD -> 1er prend

## UX Gardien (verifie)
- Si JE suis l'intervenant : "VOUS ETES EN INTERVENTION" (vert)
- Si un autre intervient : "SUIVRE [NOM]" (teal) -> carte Leaflet
- Si personne : "J'INTERVIENS" (rouge) ou "EN ATTENTE"
- Pas de doublon, 1 alerte = 1 carte
- Fiche alerte : statut clair, infos medicales, bouton contextuel

## Espace SAAD - 6 Tabs
1. Dashboard (KPIs cliquables)
2. Agences (CRUD)
3. Prescripteurs (recherche, fiche)
4. Interventions : En attente / En cours / Terminee + Intervenants
5. Prescriptions (En cours / Validees)
6. Profil

## Comptes test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise SAAD | saad@chutex.fr | demo123 |
| Intervenants SAAD | marc.dubois@saad.fr, isabelle.roux@saad.fr, antoine.garnier@saad.fr | demo123 |

## Backlog
- P1 : Build natif + BLE, WebSocket tracking, page carte Uber-style (carte fullscreen + fiche glissante)
- P2 : Exports PDF, carte itineraire natif
- P3 : Shopify, Balance Lefu, hypnogramme reel
