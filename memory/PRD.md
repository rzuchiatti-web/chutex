# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine. Integrer un calendrier horizontal glassmorphism. Afficher les elements avec statut de completion.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key)

## Charte graphique (DA) a respecter
- **Light mode**: Fond gris `#F4F4F5`, texte `#111`, sous-texte `#9CA3AF`
- **Cartes**: fond gris `#F4F4F5`, images 48x48 sans cadre, borderRadius 16
- **Separateurs**: `height: 1, background: #E5E7EB` (pas de cartes colorees)
- **Popups/Modales**: GlassModal = fond flou (backdrop-filter blur 40px+), contenu sur fond `rgba(255,255,255,0.08)` transparent. JAMAIS de fond noir opaque
- **Badges status**: Fait = vert, A faire = gris #E5E7EB
- **Boutons action**: edit (pencil, fond blanc glass), delete (poubelle, fond rouge 8%)
- **NE PAS inventer de nouveaux composants** — reutiliser les memes patterns existants

## Fonctionnalites implementees
- [x] Bibliotheque exercices/complements/hydratation/repas (CRUD + seed)
- [x] Assignation par jour + series/repos
- [x] Calendrier horizontal glassmorphism centrage jour J (toLocalDateStr)
- [x] Carte nutritionnelle light (kcal, eau, proteines|glucides|lipides)
- [x] Sections separees: Traitements / Hydratation dans la page Activite
- [x] Bibliotheque: section Hydratation separee avec bouton + dedie
- [x] GlassModal bottom sheet avec fond flou (pas noir opaque)
- [x] Edition exercice template depuis bibliotheque (inline form)
- [x] Navigation detail repas: meal-detail multi-mode (assigned/template/beneficiaire)
- [x] Suppression section "Tous les exercices"
- [x] Images sans cadres gris #EDEDEE
- [x] Popup assignation complement avec image capsule

## Routes API principales
- CRUD exercise-templates, reminder-templates, meal-templates
- CRUD assigned-exercises, assigned-reminders, assigned-meals
- GET /api/pro/beneficiary-nutrition/{ben_id}
- GET /api/pro/assigned-meal-detail/{id}
- GET /api/pro/meal-template-detail/{id}
- PUT /api/pro/exercise-templates/{id}

## Note technique
- toISOString() cause decalage UTC. Utiliser toLocalDateStr() partout.
- Metro hot reload ne prend pas toujours les gros changements. Purger .metro-cache si necessaire.
- React Native Web: setInterval pour forcer scrollLeft sur le calendrier.

## Taches P1
- [ ] Tableau de bord revenus admin

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP

## Refactoring
- ProSpace.tsx (1200+ lignes) -> ProCalendar, ProLibrary, AssignmentLists

## Credentials test
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
