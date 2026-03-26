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
- **Popups/Modales**: GlassModal = overlay sombre + fond opaque fonce `rgba(20,20,30,0.82)` avec blur. Texte blanc lisible
- **Badges status**: Fait = vert, A faire = gris #E5E7EB
- **Boutons action**: edit (pencil, fond blanc glass), delete (poubelle, fond rouge 8%)
- **Dropdowns header**: Fond sombre `rgba(20,20,30,0.88)` avec blur 24px, texte blanc, images rondes
- **NE PAS inventer de nouveaux composants** — reutiliser les memes patterns existants

## Fonctionnalites implementees
- [x] Bibliotheque exercices/complements/hydratation/repas (CRUD + seed)
- [x] Assignation par jour + series/repos
- [x] Calendrier horizontal glassmorphism centrage jour J (toLocalDateStr)
- [x] Carte nutritionnelle light (kcal, eau, proteines|glucides|lipides)
- [x] Sections separees: Traitements / Hydratation dans la page Activite
- [x] Bibliotheque: section Hydratation separee avec bouton + dedie
- [x] GlassModal fond sombre opaque (pas transparent delave)
- [x] Edition exercice template depuis bibliotheque (inline form)
- [x] Navigation detail repas: meal-detail multi-mode (assigned/template/beneficiaire)
- [x] Suppression section "Tous les exercices"
- [x] Images sans cadres gris #EDEDEE
- [x] Popup assignation complement avec image capsule
- [x] **P0 FIX**: TabBar cachee quand GlassModal ouverte (CSS injection display:none)
- [x] **REFACTORING**: ProSpace.tsx (1292 -> 326 lignes) decoupe en 6 sous-composants
- [x] **ADMIN**: Tableau de bord revenus (endpoint + composant AdminRevenue)
- [x] **FIX**: Bouton "+" pour ajouter hydratation depuis la vue jour
- [x] **FIX**: Modale sombre opaque pour lisibilite (overlay 0.55 + contenu rgba(20,20,30,0.82))
- [x] **FIX**: Edition templates via PUT (exercices, complements, repas) au lieu de POST duplicatif
- [x] **UI**: Dropdown glass sombre dans header bibliotheque avec images de categorie
- [x] **FIX**: Navigation carte alerte → /alerts (0 alertes) ou /alert-detail (alertes actives)

## Routes API principales
- CRUD exercise-templates, reminder-templates, meal-templates
- PUT /api/pro/exercise-templates/{id}
- PUT /api/pro/reminder-templates/{id}
- PUT /api/pro/meal-templates/{id}
- CRUD assigned-exercises, assigned-reminders, assigned-meals
- GET /api/pro/beneficiary-nutrition/{ben_id}
- GET /api/backoffice/revenue

## Structure apres refactoring
```
frontend/src/components/dashboard/
  ProSpace.tsx              (orchestrateur + libraryFilter state)
  pro/
    constants.ts            (API, styles, helpers)
    GlassModal.tsx          (Modal, ImagePicker, DaysPicker)
    ProCalendar.tsx          (HorizontalCalendar)
    ProDayView.tsx           (Vue jour: exercices, rappels, hydratation, repas)
    ProLibrary.tsx           (LibraryFilterDropdown + ProLibrary content)
    ProModals.tsx            (Toutes les modales + assign-hydration)
  admin/
    AdminRevenue.tsx         (Tableau de bord revenus admin)
```

## Backlog P1
- [ ] Verifier Admin Revenue dashboard via login admin UI complet
- [ ] Tester upload video pour nouveaux exercices sur mobile
- [ ] Admin login via telephone (formulaire attend tel mais admin utilise email)

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Refactoring BeneficiaryPopups.tsx (fichier volumineux)

## Credentials test
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123 (via API directe)
