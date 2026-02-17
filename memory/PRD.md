# CARE WATCH — PRD

## Direction Artistique : Bibliotheque Chutex UI
Source: bibliotheque validee avec ChatGPT, appliquee sur toute l'app.

### Palette
- **Dark**: fond #0b0f16, texte #f4f7ff, blobs animes bleu/rose/vert
- **Light**: fond blanc gradient, texte #0f172a, blobs animes bleu/peche/rose

### Composants valides
- **Header app**: avatar + nom + role + segment Beneficiaire/Gardien + drapeaux + icones rondes grises
- **Boutons Dark**: blanc glass primary (scan+halo), rouge danger, pastel IA
- **Boutons Light**: noir primary (scan), rouge danger, pastel IA
- **Bouton IA**: degrade rose/bleu pastel, utilise partout ou il y a de l'IA
- **Cards**: glass blur, bordures subtiles, fond degrade
- **Icon buttons**: ronds gris clair #eef2f6, bordure #d8e2ef, icone noire
- **Gardiens**: avatars empiles (-8px) + bouton + rond
- **Segments**: pill glass avec etat actif blanc
- **Drapeaux**: ronds glass avec selection active

### Animations
- Scan-sweep sur boutons (2.2s, accelere a .9s au hover)
- Halo pulse sur boutons
- Ripple au clic
- Glare mouse-follow
- Background blobs drift (20-22s)
- Pulse dot sur badges
- Slide-up stagger entree

### Pages redesignees
- [x] Page d'accueil hero (image plein ecran, logo, typewriter, slide button)
- [x] Onboarding 7 slides cliniques
- [x] Page de connexion (grille animee, typewriter, scan button)
- [x] CSS global avec toute la bibliotheque Chutex
- [ ] Dashboard beneficiaire (a faire)
- [ ] Dashboard gardien (a faire)
- [ ] Autres dashboards
- [ ] Pages detail
- [ ] Profil

## Fonctionnalites (inchangees)
- Auth multi-role (6 roles)
- Alertes SOS + dispatch IA
- Suivi vitaux
- Liaison gardien/beneficiaire
- Push notifications, Rappels, Teleconsultation
- Gestion appareils, Prescriptions, Back-office

## Issues connues
1. Lefu Scale BLE (P1)
2. Backend permanent natif (P2)
3. Build iOS fragile (P3)
