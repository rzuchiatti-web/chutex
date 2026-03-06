# Chutex Care - PRD

## Original Problem Statement
Application de sante preventive "Chutex Care" - React Native (Expo) + FastAPI/MongoDB

## VAPI Teleassistance Config
- Patient Assistant: cfd0f0a1-79ca-4b24-87f2-dc23c1eedb20
- Guardian Assistant: 09f9541f-ba0e-4be9-9190-c3f8ce43b9bf
- Phone (Twilio): ab5b0254-fb4c-4da8-b466-c8797298915a (+19127328606)
- Voice: ElevenLabs Turbo v2.5, voiceId pFZP5JQG7iQjIQuC4Bku
- Model: GPT-4o-mini, temp 0.6
- Scenarios: fausse alerte, douleur, chute, urgence, appel proche, silence, confusion, panique

## Completed This Session
- Age corporel Nora AI + Carte activite + Streak objectifs reels
- Objectifs journaliers coherents (calories, eau, pas, coucher)
- Refonte complete programmes (10 programmes, 573/575 guided steps)
- Personnalisation dynamique Nora selon profil (age, pathologies)
- Popup glass plein ecran exercices avec boutons choix
- Auto-save taches par index + persistance
- Dispatch SAAD geolocalisé (Haversine, rayon par agence)
- Loader video ADN sur toutes les pages
- Morning briefing corrige (1ere fois = Nora intro, ensuite = sante)
- VAPI teleassistance fonctionnelle (appels patient + gardiens)
- Auto-resolution alertes + compte-rendu
- Contexte patient transmis au gardien
- Seed programmes corrige (ne supprime plus guided_steps)

## Bugs Connus
- Programmes: voix VAPI encore un peu robotique (limite techno)
- Programmes: "Chutex Care" parfois mal prononce par l'IA

## Next Action Items
- Verifier dashboard SAAD missions intervention
- Interface gardien "J'interviens" sur alerte
- Suivi carte intervenant en temps reel
- Integration Vivoo (tests urinaires)

## Future/Backlog
- Parrainage gardien
- Essai gratuit 7 jours
- Contrat PDF
- Clone voix operatrice pour VAPI
- Numero Twilio francais (+33)
