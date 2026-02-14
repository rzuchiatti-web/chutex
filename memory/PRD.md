# CHUTEX / CARE WATCH - PRD

## Architecture
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- IA: GPT-5.2 (Emergent LLM Key)
- Voix: ElevenLabs / Twilio
- Carte: Leaflet (OpenStreetMap)

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
| Intervenants SAAD | marc.dubois@saad.fr, isabelle.roux@saad.fr, antoine.garnier@saad.fr | demo123 |

## Flux Intervention CARE WATCH
1. Alerte SOS/chute declenchee -> Teleassistance IA tente levee de doute
2. Echec levee de doute -> Dispatch vers SAAD la plus proche (geolocalisation)
3. Tous les intervenants de la SAAD notifies simultanement
4. Premier a cliquer "J'interviens" -> verrouille (autres bloques, 409 Conflict)
5. Intervenant en route -> position GPS mise a jour (polling 5s)
6. Gardiens + autres intervenants peuvent suivre sur carte (Leaflet)
7. Fiche intervention complete : carte, alerte, beneficiaire (medical), intervenant, timeline

## Espace Entreprise - Tabs (6)
1. **Dashboard** : KPIs cliquables (redirigent), commissions, agences, top prescripteurs, filtre date
2. **Agences** : CRUD agences, gestion prescripteurs/intervenants
3. **Prescripteurs** : Liste recherchable, fiche detail
4. **Interventions** : Missions (En cours/Terminees) + Intervenants (recherchable), fiche detail avec carte Leaflet
5. **Prescriptions** : En cours/Validees, fiche detail premium
6. **Profil** : Infos entreprise

## Backend API Interventions
- POST /api/interventions/{id}/accept : Acceptation verrouillee (premier gagne)
- POST /api/interventions/{id}/position : Mise a jour GPS intervenant
- GET /api/interventions/{id}/tracking : Position live pour followers
- GET /api/interventions/{id}/detail : Fiche complete (alerte + beneficiaire + intervenant)

## Backlog
- P1 : Build natif Android/iOS + BLE (bracelet J-Style, gilet S-AIRBAG)
- P1 : WebSocket pour tracking temps reel (remplacer polling)
- P2 : Exports PDF rapports, carte intervenant natif avec itineraire
- P3 : Shopify, Balance Lefu, hypnogramme sommeil reel
