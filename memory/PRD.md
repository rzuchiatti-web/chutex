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
| Gardien Coach | `professional_type: 'coach'` - programmes, prescriptions, messages, paiements |
| Gardien Physio | `professional_type: 'physio'` - idem |
| SAAD | Structure d'aide a domicile |
| Admin | Back-office complet |
| Teleassistance | Centre d'appels |

## Navbar Gardien Dynamique
| Onglet | Condition |
|--------|-----------|
| Accueil | Toujours |
| Activite | Toujours (Programmes, Rappels, Repas, Bilans) |
| Care | Si `saad_company_id` existe |
| Prescriptions | Si SAAD ou coach/physio |
| Messages | Si coach ou physio (WhatsApp-like) |
| Plus/Profil | Toujours |

## Fonctionnalites Implementees

### Module Professionnel (Phases 1-6)
- Programmes d'exercices (CRUD), Rappels, Plans de repas, Bilans IA Nora
- Prescription d'abonnements Sport/Physio (89EUR/mois) via Mollie
- Messagerie Pro-Beneficiaire (WhatsApp-like)

### Espace Gardien Unifie (25 Mars 2026)
- Mode light par defaut
- Navbar dynamique basee sur attributs du gardien
- Landing pages: Coach (ROUGE #DC2626), Physio (ORANGE #F97316)
- Auto-validation candidatures + SMS/email
- Activation automatique professional_type a l'inscription
- Refonte ProSpace en mode light avec header + image de fond

### Gestion Paiements Coach/Physio (25 Mars 2026)
- Endpoint `/api/pro/payment-dashboard` (revenus, abonnes, historique)
- Carte revenus sur dashboard Gardien

### Messagerie WhatsApp-like (25 Mars 2026)
- Composant ProMessaging dans alerts.tsx
- Liste des conversations avec avatar, dernier message, timestamp
- Chat bubbles (rouge/orange pour envoye, blanc pour recu)
- Poll auto toutes les 4 secondes

## Credentials de Test
- Beneficiaire: `+33651245918` / `test123`
- Gardien Coach: `+33655443322` / `test123`
- Gardien SAAD: `+33605221196` / `test123`
- Gardien Standard: `+33698765432` / `test123`

## Taches Futures (Backlog)
- P1: Tableau de bord des revenus administrateur
- P2: Integration balance et gilet connectes
- P2: Systeme de signature electronique (documents Admin)
- P2: Systeme de parrainage Gardiens
- P2: Flux d'essai gratuit 7 jours
- P2: Integration test urinaire Vivoo
- BLOQUE: Validation CRC32 serveur TCP J2358
