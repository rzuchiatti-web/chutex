# CHUTEX / CARE WATCH - PRD

## Page Suivi Intervention (Style Uber)
- Carte plein ecran en haut (55% ecran) avec positions beneficiaire + intervenant
- Badge statut overlay (EN ROUTE / EN ATTENTE / TERMINEE)
- Distance overlay au centre
- Fiche patient glissante depuis le bas : intervenant, alerte, patient (medical), contact urgence
- Rafraichissement auto 5s

## UX Gardien
- Dashboard : 1 carte alerte + bouton action separe
- SUIVRE MARC -> page Uber directement (pas fiche alerte)
- VOUS ETES EN INTERVENTION -> page Uber aussi
- VOIR L'ALERTE -> fiche alerte classique
- Label role : GARDIEN | Prescripteur | Intervenant

## Protocole CARE WATCH
- Cas 1 (Sans Care) : Alerte -> Gardiens -> J'INTERVIENS
- Cas 2 (Care + gardien) : Alerte -> IA -> Patient -> Gardiens -> Gardien intervient
- Cas 3 (Care + SAAD) : Alerte -> IA -> Gardiens -> Dispatch SAAD -> 1er prend (409 autres)

## Espace SAAD - 6 Tabs
Dashboard, Agences, Prescripteurs, Interventions (En attente/En cours/Terminee), Prescriptions, Profil

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
- P1 : Build natif + BLE, WebSocket tracking temps reel
- P2 : Exports PDF, itineraire Google Maps natif
- P3 : Shopify, Balance Lefu, hypnogramme reel
