# Chutex Care Watch — PRD

## Concept
Application mobile-first de santé connectée. Un **seul rôle Gardien** dont l'interface s'adapte dynamiquement via des attributs (`professional_type`, `saad_company_id`).

## Architecture
- **Frontend**: Expo/React Native (web), Expo Router
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Mollie (paiements), OpenAI GPT-4o (Nora), Lefu (appareils connectés), SMS Mode (SMS)

## Fonctionnalités Implémentées

### Session actuelle (Mars 2026)

#### Historique des paiements + Export CSV
- Section dépliable dans le dashboard pro
- Liste: bénéficiaire, date, montant HT (vert), statut
- Bouton "Exporter CSV" (format européen, délimiteur ;)

#### Refonte ProSpace (Activité) 
- Header centré vertical, titre 26px, icône, compteur
- **Pilules style souscription** : fond blanc, bordure accent quand actif, bordure grise inactif
- **Bénéficiaire inline dans le header** : liste dépliable qui étend le header, scrollable (max-height 240px)
- Quick actions, sections avec compteurs, boutons supprimer/dupliquer
- Bibliothèque + modaux glassmorphic

#### Refonte Messagerie
- Header centré vertical, titre 26px
- **Pilules Conversations/Historique** : même style souscription (blanc + bordure rouge actif)

#### Configuration Paiement IBAN
- Modal glassmorphic + SMS confirmation via SMS Mode

### Fonctionnalités précédentes
- Architecture unifiée Guardian/Professional
- Landing pages /become-pro, Mode Light, Carte de revenus, Navbar dynamique

## Comptes de Test
| Type | Téléphone | Mot de passe |
|---|---|---|
| Coach | +33655443322 | test123 |
| Gardien SAAD | +33605221196 | test123 |
| Gardien Standard | +33698765432 | test123 |

## Backlog

### P1
- Tableau de bord des revenus pour l'administrateur

### P2
- Intégration balance et gilet connectés
- Signature électronique documents Admin
- Système de parrainage Gardiens
- Essai gratuit 7 jours
- Intégration test urinaire Vivoo
- Validation CRC32 serveur TCP J2358
