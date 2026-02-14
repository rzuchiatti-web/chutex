# CHUTEX / CARE WATCH - PRD

## Systeme d'aide UX complet

### Composants (/src/components/HelpSystem.tsx)
- HelpBubble : Bouton "?" contextuel
- ContextualTip : Tip dismissable 1 fois (AsyncStorage)
- ActionFeedback : Toast confirmation
- OnboardingChecklist : Checklist progressive avec barre
- HelpCenter : FAQ + recherche + contact support

### Tips contextuels
- Beneficiaire : Explication SOS, checklist onboarding (profil, gardien, appareils, seuils)
- Gardien : Bienvenue espace gardien, guide interventions

### Centre d'aide (Profil > Centre d'aide)
- 8 FAQ completes en francais
- Recherche par mot-cle
- Contact support@chutex.fr

### Microcopy ameliore
- Alertes : "Tout va bien !" / "Aucun historique" avec descriptions
- Interventions : Messages detailles pour missions/terminees
- SOS : Feedback en 3 etapes (alertes gardiens, teleassistance, intervenant)
- Escalader -> "LANCER CARE WATCH" (plus clair pour admin)

### Checklist onboarding beneficiaire
- Completer profil medical
- Ajouter un gardien
- Connecter un appareil
- Verifier seuils d'alerte

## Contraintes respectees : 0 changement structure/nav/routes/roles

## Backlog
- P1 : Build natif + BLE, Export PDF rapports
- P2 : Notation post-intervention, coach marks animes
- P3 : Analytics UX, Shopify, Balance Lefu
