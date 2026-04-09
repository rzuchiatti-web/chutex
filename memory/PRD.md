# Chutex Care - Site Web + Tunnel de Vente - PRD

## Vision
Site web premium, clinique digital et médical, ultra optimisé à la conversion. Frontend custom React connecté au backend FastAPI existant + Shopify backend pour les commandes physiques.

## Architecture Technique
- **Frontend** : React (même repo Emergent, port 3000 séparé ou intégré)
- **Backend** : FastAPI existant (MongoDB, auth, Mollie)
- **Shopify** : Backend commandes physiques via API Storefront
  - Client ID : e1d16a76a2dc1f0856fec59cfacc75d5
  - Secret : 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
- **Paiement** : Shopify Checkout pour les produits physiques, Mollie pour les abonnements
- **i18n** : Géolocalisation auto de la langue + monnaie locale, changement manuel possible

## Offres Commerciales

### Produits physiques (Shopify Checkout)
1. Gilet airbag Elder — 879€ TTC
2. Balance Vita — 229€ TTC
3. Recharge airbag lot de 2 — 119.8€ TTC
4. Socle de recharge Elio (Bluetooth/4G) — 29.9€ TTC
5. Câble de recharge Elder — 29.9€ TTC
6. Câble de charge USB-C — 14.9€ TTC

### Abonnements (Mollie)
7. Bracelet Elio Standard — 24.9€/mois ou 249€/an (sans engagement)
8. Bracelet Elio Sport — 99€/mois (suivi coach sportif, sans engagement)
9. Bracelet Elio Physio — 99€/mois (suivi kiné/ostéo, sans engagement)
10. Téléassistance — 39.9€/mois + 50% crédit d'impôt (sans engagement)

## Pages du site

### Pages principales
1. **Accueil** — Hero, proposition de valeur, CTA, chiffres clés, témoignages
2. **Bracelet Elio** — Présentation produit + abonnements (Standard/Sport/Physio) + CTA souscrire
3. **Gilet Elder** — Présentation produit + CTA acheter
4. **Balance Vita** — Présentation produit + CTA acheter
5. **Téléassistance** — Présentation du service + CTA souscrire
6. **L'application** — Présentation des fonctionnalités de l'app (dashboard, Nora IA, suivi santé, alertes)
7. **Accessoires** — Socle, câbles, recharges airbag
8. **Espace Pro** — Page pour les professionnels (Coach, Physio, SAAD)

### Pages partenaires
9. **Devenir Coach partenaire** — Présentation + formulaire inscription
10. **Devenir Physio partenaire** — Présentation + formulaire inscription
11. **Devenir SAAD partenaire** — Présentation + formulaire inscription

### Tunnel de conversion
12. **Souscription Elio** — Choix formule → Infos → Paiement Mollie
13. **Souscription Téléassistance** — Choix → Infos bénéficiaire → Logement → Gardiens → Paiement Mollie
14. **Achat produit** — Panier → Shopify Checkout

### Pages utilitaires
15. **Connexion** — Login unifié (bénéficiaire, gardien, coach, physio, SAAD)
16. **Création de compte** — Par rôle
17. **FAQ**
18. **Mentions légales / CGV / CGU**
19. **Contact**

## Fonctionnalités techniques
- Géolocalisation automatique → langue + monnaie locale
- Changement manuel langue/monnaie
- SEO optimisé (meta tags, structured data, sitemap)
- Responsive (mobile-first)
- Tracking conversion (analytics)
- Connexion directe avec le backend existant (même API, même base users)

## Style
- Premium, clinique digital, médical
- Ultra optimisé conversion
- Pas de fioritures, focus sur la clarté et la confiance
