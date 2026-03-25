# Chutex Care Watch - PRD

## Vision
Application full-stack (React Native Web + FastAPI + MongoDB) de teleassistance et suivi sante pour personnes agees, avec systeme de roles (Beneficiaire, Gardien, Coach/Physio, Admin, SAAD).

## Architecture Principale
- **Frontend**: React Native (Expo) Web
- **Backend**: FastAPI + MongoDB (DB: `vitallink_db`)
- **Integrations**: Mollie (paiements), OpenAI GPT-4o (bilans IA Nora), SMSMode (SMS)

## Roles & Acces
| Role | Description |
|------|-------------|
| Beneficiaire | Patient suivi, acces sante, programmes |
| Gardien | Aidant, acces variable selon attributs |
| Gardien Coach | Gardien avec `professional_type: 'coach'` |
| Gardien Physio | Gardien avec `professional_type: 'physio'` |
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

### Module Professionnel (Phases 1-6)
- Programmes d'exercices (CRUD), Rappels, Plans de repas, Bilans IA Nora
- Prescription d'abonnements Sport/Physio (89EUR/mois) via Mollie
- Messagerie Pro-Beneficiaire

### Espace Gardien Unifie (25 Mars 2026)
- Mode light par defaut
- Navbar dynamique basee sur attributs du gardien
- Landing pages "Devenir Coach" (ROUGE) et "Devenir Physio" (ORANGE)
- Auto-validation candidatures + SMS/email
- Activation automatique professional_type a l'inscription
- Refonte ProSpace en mode light avec header + image de fond

### Gestion Paiements Coach/Physio (25 Mars 2026)
- Backend: endpoint `/api/pro/payment-dashboard` (revenus, abonnes actifs, historique)
- Frontend: Carte revenus sur dashboard Gardien (Abonnes actifs, Revenu mensuel HT, Total gagne HT, statut IBAN)

## Credentials de Test
- Beneficiaire: `+33651245918` / `test123`
- Gardien Coach: `+33655443322` / `test123`
- Gardien standard: `+33612345678` / `test123`

## Schema BDD cle
- `users`: role, professional_type, saad_company_id, is_prescriber
- `pro_applications`: candidatures coach/physio
- `prescriptions`: types standard, sport, physio
- `pro_subscriptions`: abonnements Pro avec Mollie
- `payment_history`: historique des paiements

## Taches Futures (Backlog)
- P1: Tableau de bord des revenus administrateur
- P2: Integration balance et gilet connectes
- P2: Systeme de signature electronique (documents Admin)
- P2: Systeme de parrainage Gardiens
- P2: Flux d'essai gratuit 7 jours
- P2: Integration test urinaire Vivoo
- BLOQUE: Validation CRC32 serveur TCP J2358
