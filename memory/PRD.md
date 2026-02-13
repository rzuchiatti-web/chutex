# CHUTEX - PRD

## Design System
- Noir & blanc, fond beige #F5F0EB + fond pastel CSS, glassmorphisme iOS
- Boutons noirs pill, uppercase, bold
- Images 3D medicales (coeur, sang, lune, thermometre)

## Architecture  
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- i18n: FR, EN, DE, ES, IT (I18nContext)

## Session 8 (Feb 13, 2026)
### Accompli
- i18n complet 5 langues (FR/EN/DE/ES/IT) avec I18nProvider
- Tab labels dynamiques selon la langue
- Selecteur langue avec drapeaux dans le profil (persiste AsyncStorage)
- Drapeau actif dans le header dashboard
- Seuils d'alertes fonctionnels (sauvegarde + rechargement backend)
- Suppression rappels fonctionnelle (confirmation modal custom, pas Alert.alert)
- Image sante 220px avec chevauchement glass
- Calendrier inline sur le graphique
- Analyse IA par metrique
- Switch bidirectionnel gardien/beneficiaire
- Inscription simplifiee (seulement benef/gardien)

## Session 9 (Feb 13, 2026)
### Accompli
- **Dashboard Gardien redesigne** : Nouveau design glassmorphisme avec carte de bienvenue, stats (beneficiaires/alertes/interventions), cartes beneficiaires avec vitals et badge sante, section prescriptions
- **Drapeaux de langue dans le header** : LanguageFlagButton component fonctionnel dans tous les dashboards (beneficiaire, gardien, teleassistance, admin) avec dropdown FR/EN/DE/ES/IT
- **Switch de role corrige** : active_role, has_guardian_space, has_beneficiary_space retournes par l'API. Dashboard utilise `user.active_role || user.role` pour choisir la vue. Switch instantane sans reconnexion via refreshUser()
- **Upload photo de profil** : Bouton camera sur l'avatar, upload web via FileReader/dataURL, sauvegarde backend avatar_url
- **Vue carte d'intervention** : Page intervention-map.tsx style "Uber Eats" avec Google Maps embed, ETA estime, infos beneficiaire/intervenant, bouton navigation
- **Flux d'activation pre-rempli** : Pages activate-beneficiary et activate-guardian pre-remplissent les donnees connues du profil utilisateur
- **Suppression de beneficiaire** : Bouton "RETIRER CE BENEFICIAIRE" sur la fiche beneficiaire avec confirmation, endpoint DELETE /guardian/beneficiary/{bid}/unlink
- **Beneficiary detail redesigne** : Style glassmorphisme, cartes vitales, infos medicales, appareils, alertes, rapport IA
- **Tests 100% backend, 95% frontend** (iteration 13)

## Backlog
- P1: Animation switch profil (carte flip animee sur le dashboard)
- P1: Build natif Android/iOS + integration BLE (bracelet J-Style, gilet S-AIRBAG)
- P2: Integration bracelet J-Style donnees completes (SpO2, BP, Sleep hypnogram)
- P2: Integration Balance Lefu
- P2: Amelioration appels IA (speech recognition Twilio + analyse LLM)
- P3: Integration Shopify (bloquee - cle d'acces manquante)
- P3: Build iOS (bloquee - credentials Apple Developer)

## Credentials de test
| Role | Email | Mot de passe |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Intervenant Care | ludivine.moutio@care.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Teleassistance | plateau@chutex.fr | demo123 |
