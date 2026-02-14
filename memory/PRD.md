# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key) / Voix: ElevenLabs / Twilio
- Carte: Leaflet (OpenStreetMap)

## Protocole CARE WATCH - 3 Cas
### Cas 1 (Sans abonnement Care)
Alerte -> Tous gardiens notifies -> 1er gardien clique "J'interviens" -> Autres suivent sur carte

### Cas 2 (Care + gardien resout)  
Alerte -> Gardiens + Teleassistance IA -> IA appelle patient -> Si OK, stop. Sinon -> IA appelle gardiens -> Si gardien intervient, stop. Si gardien clique "J'interviens" dans l'app pendant le processus, ca arrete le protocole

### Cas 3 (Care + personne ne repond)
Alerte -> IA -> Patient pas OK -> Gardiens injoignables -> Dispatch SAAD la plus proche -> 4 intervenants notifies -> 1er qui clique prend la mission (409 pour les autres) -> Gardiens suivent sur carte

## Espace Entreprise SAAD - 6 Tabs
1. Dashboard (KPIs cliquables, commissions, filtre date)
2. Agences (CRUD, gestion prescripteurs/intervenants)
3. Prescripteurs (recherche, fiche detail)
4. **Interventions** : 3 sous-onglets **En attente** (pas d'intervenant) / **En cours** (intervenant assigne) / **Terminee** + sous-tab Intervenants
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
