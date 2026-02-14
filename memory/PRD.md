# CHUTEX / CARE WATCH - PRD

## Systeme d'aide UX (AJOUTE SANS MODIFIER LA STRUCTURE)

### Composants crees (/src/components/HelpSystem.tsx)
- HelpBubble : Bouton "?" contextuel avec modal explicative
- ContextualTip : Tip dismissable (1 seule fois, AsyncStorage)
- ActionFeedback : Toast de confirmation apres action
- OnboardingChecklist : Checklist progressive
- HelpCenter : FAQ + recherche + contact support

### Tips contextuels ajoutes
- Beneficiaire dashboard : Explication SOS ("En cas d'urgence, appuyez...")
- Gardien dashboard : Bienvenue espace gardien ("Suivez la sante de vos proches...")

### Centre d'aide (Profil > Centre d'aide)
- 8 FAQ : SOS, gardien, prescripteur, intervenant, seuils, suivi, donnees, challenge
- Recherche par mot-cle
- Contact support@chutex.fr

### Contraintes respectees
- AUCUN changement de navigation/routes/onglets
- AUCUN changement de structure de donnees
- AUCUN changement de droits/roles
- Compatible avec tous les flux existants

## Comptes test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise SAAD | saad@chutex.fr | demo123 |

## Backlog UX
- Coach marks (bulles etape par etape) sur premiere utilisation
- Mini-tutos animes pour actions complexes
- Checklist progressive beneficiaire/gardien
- Analytics UX (ouverture aides, completion tutos)
- Microcopy amélioré sur tous les etats vides
