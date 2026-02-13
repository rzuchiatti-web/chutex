# CHUTEX - PRD

## Design System
- Noir & blanc, fond beige #F5F0EB + fond pastel CSS, glassmorphisme iOS
- Boutons noirs pill, uppercase, bold
- Images 3D medicales (coeur, sang, lune, thermometre)

## Architecture  
- Frontend: React Native / Expo / Expo Router (TypeScript)
- Backend: FastAPI (Python) - MongoDB - JWT Auth
- i18n: FR, EN, DE, ES, IT (I18nContext)
- IA: GPT-5.2 (Emergent LLM Key) pour analyse vocale et synthese protocole
- Voix: ElevenLabs (multilingual_v2) pour appels telephoniques IA
- Telephonie: Twilio (appels, SMS, speech recognition)

## Session 8 (Feb 13, 2026)
### Accompli
- i18n complet 5 langues (FR/EN/DE/ES/IT) avec I18nProvider
- Tab labels dynamiques selon la langue
- Selecteur langue avec drapeaux dans le profil (persiste AsyncStorage)
- Drapeau actif dans le header dashboard
- Seuils d'alertes fonctionnels (sauvegarde + rechargement backend)
- Suppression rappels fonctionnelle (confirmation modal custom)
- Image sante 220px avec chevauchement glass
- Calendrier inline sur le graphique
- Analyse IA par metrique
- Switch bidirectionnel gardien/beneficiaire
- Inscription simplifiee (seulement benef/gardien)

## Session 9 (Feb 13, 2026)
### Accompli
- Dashboard Gardien redesigne (glassmorphisme, stats, cartes beneficiaires)
- Drapeaux de langue dans le header (LanguageFlagButton dans tous les dashboards)
- Switch de role corrige (active_role, has_guardian_space, has_beneficiary_space)
- Upload photo de profil (camera button, FileReader upload)
- Vue carte d'intervention style Uber Eats (intervention-map.tsx)
- Flux d'activation pre-rempli (activate-beneficiary/guardian)
- Suppression de beneficiaire (bouton + DELETE endpoint)
- Tests 100% backend, 95% frontend (iteration 13)

## Session 10 (Feb 13, 2026)
### Accompli - Amelioration Appels IA & Protocole Alerte
- **Analyse vocale GPT-5.2** : POST /api/ai/analyze-speech - Remplace detection par mots-cles par analyse IA d'intention/sentiment/urgence
- **Synthese IA du protocole** : POST /api/ai/protocol-summary - Resume structure de toute l'execution du protocole d'alerte
- **Reconnaissance vocale** : Appels Twilio utilisent `input='speech'` avec `language='fr-FR'` au lieu de touches DTMF
- **Messages ElevenLabs contextuels** : 11 messages adaptes (heart_anomaly, spo2_low, unclear_response, guardian_alert, guardian_followup, emergency_dispatch, etc.)
- **Refonte page alerte-detail** : Glassmorphisme avec panneau actions operateur (APPELER IA, ESCALADER, CLOTURER, SYNTHESE IA), appels gardiens, timeline visuelle, panel analyse IA
- **Auto-escalation amelioree** : Messages ElevenLabs contextuels selon le type d'alerte, analyse GPT-5.2 des reponses vocales
- Tests 100% backend (18/18), 100% frontend (iteration 14)

## Backlog
- P1: Animation switch profil (carte flip animee sur le dashboard)
- P1: Build natif Android/iOS + integration BLE (bracelet J-Style, gilet S-AIRBAG)
- P2: Integration bracelet J-Style donnees completes (SpO2, BP, Sleep hypnogram)
- P2: Integration Balance Lefu
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
