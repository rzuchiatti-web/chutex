# Chutex Care Watch - PRD

## Vision
Application full-stack (React Native Web + FastAPI + MongoDB) de teleassistance et suivi sante pour personnes agees, avec systeme de roles (Beneficiaire, Gardien, Professionnel/Coach/Physio, Admin, SAAD).

## Architecture Principale
- **Frontend**: React Native (Expo) Web
- **Backend**: FastAPI + MongoDB (DB: `vitallink_db`)
- **Integrations**: Mollie (paiements), OpenAI GPT-4o (bilans IA Nora), SMSMode (SMS)

## Roles & Acces
| Role | Description |
|------|-------------|
| Beneficiaire | Patient suivi, acces sante, programmes |
| Gardien | Aidant, acces variable selon attributs |
| Gardien Coach | Gardien avec `professional_type: 'coach'` - acces programmes, prescriptions, messages |
| Gardien Physio | Gardien avec `professional_type: 'physio'` - idem + ADELI/RPPS |
| SAAD | Structure d'aide a domicile |
| Admin | Back-office complet |
| Teleassistance | Centre d'appels |

## Navbar Gardien Dynamique
| Onglet | Condition |
|--------|-----------|
| Accueil | Toujours |
| Activite | Toujours (Programmes, Rappels, Repas, Bilans) |
| Intervention Care | Si `saad_company_id` existe |
| Prescriptions | Si SAAD ou coach/physio |
| Messages | Si coach ou physio uniquement |
| Plus/Profil | Toujours |

## Fonctionnalites Implementees

### Phase 1-3 : Module Professionnel
- Programmes d'exercices (CRUD)
- Rappels (complements, hydratation)
- Plans de repas
- Bilans IA Nora

### Phase 4-6 : Abonnements & Messagerie
- Prescription d'abonnements Sport/Physio (89EUR/mois)
- Integration Mollie pour paiements
- Messagerie Pro-Beneficiaire

### Espace Gardien Unifie (25 Mars 2026)
- **Mode light par defaut** sur toute l'app
- **Navbar dynamique** basee sur les attributs du gardien
- **Landing pages** "Devenir Coach" et "Devenir Physio" (formulaire multi-step + signature de contrat)
- **Auto-validation** des candidatures (SMS + email de confirmation)
- **Activation automatique** du `professional_type` a l'inscription gardien si candidature approuvee
- **Refonte ProSpace** en mode light avec header et image de fond

## Credentials de Test
- Beneficiaire: `+33651245918` / `test123`
- Gardien Coach: `+33655443322` / `test123`
- Gardien standard: `+33612345678` / `test123`

## Schema BDD cle
- `users`: role, professional_type, saad_company_id, is_prescriber
- `pro_applications`: candidatures coach/physio (type, status, phone, diplomes, contrat signe)
- `prescriptions`: types standard, sport, physio
- `pro_subscriptions`: abonnements Pro avec Mollie

## Taches Futures (Backlog)
- P1: Tableau de bord des revenus administrateur
- P2: Integration balance et gilet connectes
- P2: Systeme de signature electronique (documents Admin)
- P2: Systeme de parrainage Gardiens
- P2: Flux d'essai gratuit 7 jours
- P2: Integration test urinaire Vivoo
- BLOQUE: Validation CRC32 serveur TCP J2358
- P2: Gestion paiement Mollie pour Coach/Physio (configurer, modifier)
