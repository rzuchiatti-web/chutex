# CHUTEX / CARE WATCH - PRD

## Fond Pastel Anime (PastelMistBackground)
- Composant: `/src/components/PastelMistBackground.tsx`
- Branche: `_layout.tsx` racine, derriere tout le contenu
- 5 blobs pastel (rose #F7C7D9, peche #F6D0B1, bleu #CFE6FF, lavande #D8CFF3)
- Opacite 12-18%, blur 80px, cycles 22-40s
- GPU-friendly (transform/opacity), will-change
- Respect prefers-reduced-motion (animation: none)
- pointer-events: none, z-index: 0
- Fallback natif: blobs statiques RN

## Systeme d'aide UX
- HelpBubble, ContextualTip, ActionFeedback, OnboardingChecklist, HelpCenter
- Tips contextuels: SOS (beneficiaire), bienvenue (gardien)
- Checklist onboarding: 4 etapes progressives
- Centre d'aide: 8 FAQ + recherche + contact support
- Microcopy ameliore: etats vides pedagogiques

## Comptes test
| Role | Email | MdP |
|---|---|---|
| Beneficiaire | robert.martin@email.fr | demo123 |
| Gardien | claire.martin@email.fr | demo123 |
| Admin | admin@chutex.fr | demo123 |
| Entreprise SAAD | saad@chutex.fr | demo123 |

## Backlog
- P1 : Build natif + BLE, Export PDF
- P2 : Coach marks animes, notation post-intervention
- P3 : WebSocket, Shopify, Balance Lefu
