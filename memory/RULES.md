# RULES - Agent Behavior

## RULE 1: COHERENCE GLOBALE
Quand l'utilisateur demande de modifier un element (carte, popup, champ, texte, style, donnee):
1. `grep -rn` dans TOUT le frontend + backend pour trouver TOUTES les occurrences
2. Mettre a jour CHAQUE occurrence avec le meme style/logique/texte
3. Verifier la coherence entre: dashboard, page detail, profil, popups, tabs, backend

## RULE 2: CHECKLIST AVANT FINISH
Avant de declarer une tache terminee, verifier:
- [ ] L'element modifie est-il present ailleurs dans l'app ?
- [ ] Le meme composant/carte existe-t-il sur d'autres pages ?
- [ ] Les donnees backend sont-elles coherentes avec le frontend ?
- [ ] Les popups utilisent-elles le meme pattern (glass = backdrop-filter blur 32px) ?

## RULE 3: STYLE PATTERNS CHUTEX
- Popup glass full-page: `position fixed, backdrop-filter blur(32px), background rgba(0,0,0,0.2), overflowY scroll`
- Popup glass centree: `backdrop-filter blur(24px), background rgba(0,0,0,0.4)`, inner card `rgba(20,20,30,0.92)`
- Carte interactive: `padding 18px 20px, borderRadius 22, background rgba(255,255,255,0.05), border rgba(X,X,X,0.15)`
- Badge status: `inline-flex, gap 4, padding 4px 10px, borderRadius 999, point 5px + texte 10px`
- Commission: `getCommission(p)` fallback partout, suffixe `/mois` si monthly
