# Chutex Care Watch - PRD

## Vision
Application full-stack de teleassistance et suivi sante pour personnes agees.

## Architecture
- **Frontend**: React Native (Expo) Web
- **Backend**: FastAPI + MongoDB (`vitallink_db`)
- **Integrations**: Mollie, OpenAI GPT-4o, SMSMode

## Navbar Gardien Dynamique
| Onglet | Condition |
|--------|-----------|
| Accueil | Toujours |
| Activite | Toujours |
| Care | Si `saad_company_id` |
| Prescriptions | Si SAAD ou coach/physio |
| Messages | Si coach ou physio |
| Plus | Toujours |

## Fonctionnalites Implementees

### Espace Coach/Physio (Onglet Activite) - Redesign 25 Mars 2026
- **Vue Patients**: Selecteur par patient, boutons rapides (Programme/Rappel/Repas), liste des programmes avec exercices inline, rappels, plans de repas
- **Vue Bibliotheque**: Tous les programmes existants en templates reutilisables, bouton "Attribuer" pour dupliquer en un clic vers un autre patient
- **Modals**: Creation programme, ajout exercice, rappel (medication/hydratation), plan de repas
- **API**: GET /api/pro/all-programs, POST /api/pro/programs/duplicate/{id}/{ben_id}

### Messagerie WhatsApp-like
- Liste conversations, chat bubbles, envoi temps reel, poll auto 4s

### Landing Pages Coach/Physio
- Coach: ROUGE (#DC2626), Physio: ORANGE (#F97316)
- Multi-step: infos, diplomes, contrat + signature electronique

### Bug Fixes 25 Mars 2026
- Suppression pillule Prescripteur du profil
- Switch role coach<->gardien corrige (require_pro verifie professional_type)
- Navbar light sur toutes les pages gardien
- Headers uniformises (image de fond + contenu arrondi)

## Credentials
| Type | Telephone | MdP |
|------|-----------|-----|
| Coach | +33655443322 | test123 |
| SAAD | +33605221196 | test123 |
| Standard | +33698765432 | test123 |
| Beneficiaire | +33651245918 | test123 |

## Backlog
- P1: Tableau de bord revenus admin
- P2: Balance/gilet connectes
- P2: Signature electronique docs Admin
- P2: Parrainage Gardiens
- P2: Essai gratuit 7j
- P2: Test urinaire Vivoo
