# CARE WATCH — PRD

## Direction Artistique : Chutex Clinique
- Palette: Noir/Blanc/Gris + fonds images satinés (violet/orange/rouge/vert/bleu/noir)
- Composants: glass cards, boutons slide, pilules status, grilles info glass, typewriter
- Icons: Remix Icon (https://remixicon.com) — CDN chargé globalement
- Pas d'emojis — jamais
- Bouton slide = composant standard pour toute action importante

## Pages redesignées
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

## TODO URGENT (prochain fork)
- [ ] Remplacer TOUS les emojis par des Remix Icons
- [ ] Page "Comprendre les alertes" avec explication detaillee du processus CARE WATCH + onglet Care
- [ ] Page "Programme recompenses" avec explication fonctionnement, regles, FAQ
- [ ] Design profil
- [ ] Design accueil gardien + beneficiaire
- [ ] Design sante/appareils
- [ ] Fiche intervenant avec fond rouge (meme design alertes)
- [ ] Expo Go test
- [ ] Automatiser cloture mensuelle challenges
- [ ] Corriger: pas de bouton intervenir/cloturer si intervenant deja assigne (FAIT cote code, verifier en prod)

## Logique alertes
- Si intervenant assigne → gardien ne peut NI intervenir NI cloturer
- Si pas d'intervenant → gardien peut intervenir + cloturer
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
