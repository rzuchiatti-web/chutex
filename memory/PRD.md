# CARE WATCH — PRD

## Direction Artistique : Chutex Clinique
- Palette: Noir/Blanc/Gris + fonds images satines
- Fonds: Rouge (alertes), Violet (interventions), Orange (prescriptions), Vert (resolues), Noir (dashboards/appareils), Bleu nuit (sante), Peche (beneficiaire), Argente (profil), Gold (challenges)
- Composants: glass cards (backdrop-blur), boutons slide, pilules status, grilles info glass
- Icons: Remix Icon CDN via WebIcon.tsx (116+ icones mappees)
- Separateurs glass entre chaque donnee dans les fiches

## Comptes test
| Role | Email | Password |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| SAAD Company | saad@chutex.fr | demo123 |

## Pages redesignees (toutes en plein ecran web)
### Beneficiaire
- [x] Dashboard (fond peche, vitals, SOS, gardiens, teleconsultation, appareils)
- [x] Sante (fond bleu nuit, 4 vitals, activite, FC graph, sommeil, actions rapides)
- [x] Appareils (fond noir, images produits SVG, barre batterie glass, boutons associer/decouvrir)
- [x] Teleconsultation (fond bleu, QCM glass, slide appel)
- [x] Alertes (fond rouge plein ecran, cartes glass, detail complet)

### Gardien
- [x] Dashboard (fond noir, stats, alertes, beneficiaires)
- [x] Alertes (fond rouge, detail avec beneficiaire complet, gardiens, intervenant popup)
- [x] Interventions Care (fond violet, toggle, cartes glass, detail complet)
- [x] Prescriptions (fond orange, toggle, detail complet)

### SAAD Company
- [x] Dashboard (fond noir, carte structure + agences, alertes rouge, intervention Care violet, prescriptions orange, challenge gold)
- [x] Alertes (fond rouge plein ecran, filtrees par profession pro)
- [x] Interventions (fond violet plein ecran, header scrollable, barre recherche, voir intervenants fond violet)
- [x] Prescriptions (fond orange plein ecran, montant dynamique, selecteur mois, prochain versement, carte challenge)
- [x] Agences (fond noir, liste agences, detail avec intervenants, creer/modifier/supprimer)

### Admin
- [x] Dashboard (fond noir, stats 4 colonnes, back-office, classement)
- [x] Intervenants Care (fond violet, tabs codes/actifs/missions)
- [x] Prescripteurs (fond orange, tabs codes/prescripteurs/souscriptions)
- [x] Alertes (partage avec gardien)

### Teleassistance
- [x] Dashboard (fond noir, stats, alertes, abonnes)
- [x] Teleassistance IA (fond noir, tabs en cours/tous/stats, incidents fond rouge)
- [x] Abonnes (fond noir, liste glass)
- [x] Alertes (partage avec gardien)

### Commun
- [x] Profil (fond argente, avatar, pilules role/abonnement/Care/prescripteur)
- [x] Login (grille clinique, typewriter)
- [x] Onboarding (7 slides)
- [x] Page intervention en cours (Leaflet carte + bottom sheet draggable 3 snaps)
- [x] Fiches detail (gardien, beneficiaire, intervenant, prescripteur, abonne) — fond noir glass

## Fiches detail enrichies
- Beneficiaire: nom, tel, email, date naissance, genre, morphologie, groupe sanguin, pathologies (jaune), allergies (rouge), medecin + tel, contact urgence + tel, adresse
- Intervenant: nom, structure, pilule Care, tel, email, distance, heure accepte/termine, statut — popup cliquable
- Prescripteur: nom, structure, tel, email, prescriptions count, commission
- Alerte resolue: resolution + duree, beneficiaire complet, rapport intervention, rapport cloture, intervenant, chronologie

## Architecture
- Frontend: Expo/React Native for Web + Expo Router
- Backend: FastAPI + MongoDB
- Icons: Remix Icon CDN (remixicon@4.6.0) via WebIcon.tsx
- Maps: Leaflet + OSRM
- Auth: JWT tokens

## Bugs connus
- Lefu Scale BLE: donnees live non fonctionnelles (parsing incorrect)
- App native TestFlight: "Network Request Failed" (URL backend temporaire)

## Taches restantes
- P1: Deployer backend sur hebergeur permanent
- P1: Correction parsing BLE Lefu Scale (SDK PPBluetoothKit natif iOS)
- P2: Build natif et integration BLE bracelet J-Style
- P2: Resolution connectivite app native
- P3: Integration Shopify (bloque)
- P4: Mode hors-ligne intervenants
