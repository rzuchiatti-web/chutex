# Chutex Care Watch - PRD

## Vision
Application full-stack (React Native Web + FastAPI + MongoDB) de teleassistance et suivi sante pour personnes agees.

## Architecture Principale
- **Frontend**: React Native (Expo) Web
- **Backend**: FastAPI + MongoDB (DB: `vitallink_db`)
- **Integrations**: Mollie (paiements), OpenAI GPT-4o (bilans IA Nora), SMSMode (SMS)

## Roles & Acces
| Role | Description |
|------|-------------|
| Beneficiaire | Patient suivi |
| Gardien | Aidant, acces variable selon attributs |
| Gardien Coach | `professional_type: 'coach'` |
| Gardien Physio | `professional_type: 'physio'` |
| SAAD | Structure d'aide a domicile |
| Admin | Back-office complet |

## Navbar Gardien Dynamique
| Onglet | Condition |
|--------|-----------|
| Accueil | Toujours |
| Activite | Toujours |
| Care | Si `saad_company_id` |
| Prescriptions | Si SAAD ou coach/physio |
| Messages | Si coach ou physio |
| Plus/Profil | Toujours |

## Fonctionnalites Implementees

### Module Professionnel (Phases 1-6)
- Programmes, Rappels, Repas, Bilans IA Nora
- Abonnements Sport/Physio (89EUR/mois) via Mollie
- Messagerie Pro-Beneficiaire (WhatsApp-like)

### Espace Gardien Unifie (25 Mars 2026)
- Mode light par defaut
- Navbar dynamique
- Landing pages: Coach (ROUGE), Physio (ORANGE)
- Auto-validation candidatures
- Activation automatique professional_type

### Bug Fixes (25 Mars 2026)
- Switch role: coach peut maintenant basculer gardien<->beneficiaire
- require_pro: verifie professional_type au lieu du role
- Navbar light sur page Messages
- Headers Activite et Messages: bords arrondis, image de fond, meme style que dashboard

## Credentials de Test
- Beneficiaire: `+33651245918` / `test123`
- Gardien Coach: `+33655443322` / `test123`
- Gardien SAAD: `+33605221196` / `test123`
- Gardien Standard: `+33698765432` / `test123`

## Taches Futures (Backlog)
- P1: Tableau de bord des revenus administrateur
- P2: Integration balance et gilet connectes
- P2: Signature electronique (documents Admin)
- P2: Parrainage Gardiens
- P2: Essai gratuit 7 jours
- P2: Test urinaire Vivoo
- BLOQUE: CRC32 serveur TCP J2358
