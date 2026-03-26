# Chutex Care Watch — PRD

## Probleme original
Refondre l'espace d'activite (ProSpace) des coachs/gardiens pour la gestion directe d'exercices, rappels/complements et repas sur-mesure avec assignation par jour de la semaine.

## Architecture
- **Backend**: FastAPI + MongoDB (port 8001)
- **Frontend**: React Native Web (Expo Router) (port 3000)
- **Integrations**: SMS Mode, Mollie, OpenAI GPT-4o (Emergent LLM Key)

## Charte graphique (DA)
- Light mode: #F4F4F5, #111, #9CA3AF
- GlassModal: overlay + fond opaque rgba(20,20,30,0.82)
- Dropdowns header: rgba(20,20,30,0.88) + blur 24px
- Icones exercices: Remix Icon par categorie
- Icones repas: ri-sun-line, ri-restaurant-line, ri-cake-2-line, ri-cup-line, ri-moon-line

## Fonctionnalites implementees
- [x] CRUD exercices/complements/hydratation/repas + seed 20 exercices + 12 repas
- [x] Assignation par jour + series/repos
- [x] Calendrier horizontal glassmorphism
- [x] Carte nutritionnelle + objectif poids
- [x] Sections Traitements / Hydratation / Repas separees
- [x] GlassModal fond sombre opaque sans marge bottom
- [x] Edition templates via PUT (pas duplication POST)
- [x] Dropdown glass sombre dans header bibliotheque
- [x] Navigation carte alerte corrigee (0 alertes -> /alerts)
- [x] TimeWheelPicker pour assignation heure (complement/hydratation)
- [x] Filtre complement exclut hydratation
- [x] Pill tabs avec blur
- [x] Icones dans cartes exercices et repas (au lieu d'images)
- [x] Refactoring ProSpace (6 sous-composants)
- [x] Admin Revenue Dashboard
- [x] TabBar cachee quand GlassModal ouverte

## Structure
```
frontend/src/components/dashboard/
  ProSpace.tsx              (orchestrateur + libraryFilter + editingTemplateId)
  pro/
    constants.ts            (API, styles, helpers)
    GlassModal.tsx          (Modal, ImagePicker, DaysPicker, TimeWheelPicker)
    ProCalendar.tsx
    ProDayView.tsx           (icones exercices + icones repas par type)
    ProLibrary.tsx           (LibraryFilterDropdown + contenu)
    ProModals.tsx            (Modales + filtre hydratation exclu des complements)
```

## Backlog P1
- [ ] Verifier Admin Revenue dashboard via login admin UI
- [ ] Tester upload video pour exercices
- [ ] Admin login via telephone

## Backlog P2
- [ ] Balance/gilet connectes
- [ ] Signature electronique
- [ ] Parrainage Gardiens
- [ ] Essai gratuit 7 jours
- [ ] Integration Vivoo
- [ ] Validation CRC32 TCP
- [ ] Refactoring BeneficiaryPopups.tsx

## Credentials
- Coach: +33655443322 / test123
- Beneficiaire: +33651245918 / test123
- Admin: admin@chutex.fr / admin123
