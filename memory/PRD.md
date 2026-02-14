# CHUTEX / CARE WATCH - PRD

## Protocole CARE WATCH
### Cas 1 (Sans Care) : Alerte -> Gardiens notifies -> 1er gardien clique "J'INTERVIENS" -> Autres suivent sur carte
### Cas 2 (Care + gardien) : Alerte -> IA appelle patient -> Si OK stop, sinon -> IA appelle gardiens -> Gardien intervient -> Si "J'INTERVIENS" dans l'app, arrete le process
### Cas 3 (Care + SAAD) : Alerte -> IA -> Patient pas OK -> Gardiens injoignables -> Dispatch SAAD la plus proche -> 1er intervenant prend -> Gardiens suivent

## UX Gardien (corrige)
- Label role : "GARDIEN | Prescripteur" (et non "Prescripteur")
- Dashboard alerte active : boutons clairs (VOIR L'ALERTE ET INTERVENIR / SUIVRE SUR LA CARTE / EN ATTENTE)
- Fiche alerte : statut lisible en francais, bouton J'INTERVIENS ou SUIVRE, infos medicales beneficiaire, PAS de bouton Resoudre
- Carte Leaflet quand intervenant en route

## Espace SAAD - 6 Tabs
1. Dashboard (KPIs cliquables, filtres date)
2. Agences (CRUD, prescripteurs + intervenants)
3. Prescripteurs (recherche, fiche)
4. Interventions : **En attente** / **En cours** / **Terminee** + Intervenants
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
- P1 : Build natif + BLE, WebSocket tracking
- P2 : Exports PDF, carte itineraire natif
- P3 : Shopify, Balance Lefu, hypnogramme reel
