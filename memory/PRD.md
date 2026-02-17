# CARE WATCH — PRD

## Direction Artistique : Chutex Clinique
- Palette: Noir/Blanc/Gris + fonds images satines (violet/orange/rouge/vert/bleu/noir)
- Composants: glass cards, boutons slide, pilules status, grilles info glass, typewriter
- Icons: Remix Icon (https://remixicon.com) — CDN charge globalement, utilise via WebIcon.tsx
- Pas d'emojis — jamais
- Bouton slide = composant standard pour toute action importante

## Pages redesignees
- [x] Login (grille clinique, typewriter)
- [x] Onboarding 7 slides (hero + 6 slides cliniques)
- [x] Dashboard beneficiaire (header Chutex, cards glass)
- [x] Dashboard gardien (header Chutex)
- [x] Interventions inactif (violet, slide, PIN 6 chiffres)
- [x] Interventions actif (header violet, toggle, cartes violet/vert)
- [x] Intervention detail (early return, infos medicales, rapport, chronologie)
- [x] Prescriptions inactif (orange, slide, PIN)
- [x] Prescriptions actif (header orange, total EUR, recompenses, cartes)
- [x] Prescription detail (early return, grille glass, email/phone cliquables)
- [x] Rewards page (early return, challenges expandables, anonymat, historique)
- [x] Alertes (header rouge, toggle en cours/cloturees, cartes rouge/vert)
- [x] Alerte detail (early return, fond rouge/vert, boutons conditionnels)
- [x] Rapport cloture (page plein ecran, 3 questions obligatoires + note)
- [x] Teleconsultation beneficiaire (fond bleu, QCM glass, slide appel)
- [x] Navbar glass flottante
- [x] Carte Teleconsultation (fond bleu image, medecin, bouton Consulter)
- [x] Page "Comprendre les alertes" (5 etapes, roles, FAQ)
- [x] Page "Programme de recompenses" (fonctionnement, grille primes, regles, FAQ)

## DONE ce fork (17 fev 2026)
- [x] Remplacer TOUS les emojis par des Remix Icons (WebIcon.tsx refait avec mapping ri-*)
- [x] Page "Comprendre les alertes" avec explication detaillee du processus CARE WATCH
- [x] Page "Programme recompenses" avec fonctionnement, regles, FAQ
- [x] Integrer le fond bleu de la page consultation dans la carte teleconsultation beneficiaire

## TODO (prochain fork)
- [ ] Design profil
- [ ] Design accueil gardien + beneficiaire
- [ ] Design sante/appareils
- [ ] Fiche intervenant avec fond rouge (meme design alertes)
- [ ] Expo Go test
- [ ] Automatiser cloture mensuelle challenges
- [ ] Corriger: pas de bouton intervenir/cloturer si intervenant deja assigne (FAIT cote code, verifier en prod)

## Logique alertes
- Si intervenant assigne -> gardien ne peut NI intervenir NI cloturer
- Si pas d'intervenant -> gardien peut intervenir + cloturer
- Beneficiaire peut TOUJOURS cloturer
- Cloture = page plein ecran avec 3 questions obligatoires + note

## Donnees en base
- rewards_history: Janvier 2026 (Claire 2eme = 70EUR), Fevrier actif
- Alertes: 1 sans intervention (CALLING_PATIENT), 1 avec intervention (Antoine Garnier)
- Prescription Ludivine Moutio validee (100EUR)

## Comptes test
| Role | Email | Password |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant | ludivine.moutio@care.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Company | saad@chutex.fr | demo123 |

## Architecture icons (Remix Icons)
- WebIcon.tsx: Mappe les noms d'icones internes (home-outline, alert-circle, etc.) vers les classes Remix Icon (ri-home-4-line, ri-alarm-warning-line, etc.)
- CDN charge via PastelMistBackground.tsx: remixicon@4.6.0
- Sur web: rendu via `<i className="ri-xxx" />`
- Sur natif: fallback vers @expo/vector-icons (Ionicons, MaterialCommunityIcons)
