# CHUTEX - Teleassistance & Telesante Application

## Problem Statement
Application de teleassistance et telesante "CHUTEX" pour le suivi des personnes agees/vulnerables avec 4 roles.

## Design System
- **Palette**: Noir & Blanc uniquement, fond beige chaud (#F5F0EB), glassmorphisme iOS
- **Glass Effect**: backdrop-blur(40px), rgba(255,255,255,0.45), border rgba(255,255,255,0.7), inset box-shadow
- **Boutons**: Noirs arrondis pill, uppercase, bold, box-shadow
- **Badges**: "BONNE SANTE" vert (#C8E6C9)
- **Illustrations 3D**: Coeur, globules, lune, thermometre (sante) + goutte, pilule, reveil (rappels)
- **Categories sante**: Cardiaque, Sanguine, Sommeil, Physique

## Architecture
- **Frontend**: React Native / Expo / Expo Router (TypeScript)
- **Backend**: FastAPI (Python) - MongoDB - JWT Auth

## Session 5-6 (Feb 12-13, 2026) - REDESIGN COMPLET
### Accompli
- Redesign noir & blanc + glassmorphisme iOS complet
- Dashboard beneficiaire: illustrations 3D, badges sante, appareils, objectifs, rappels
- Dashboard gardien: cartes beneficiaires avec photos, badges, bouton INFORMATION
- Dashboard admin: KPIs sur dashboard principal
- Dashboard teleassistance: stats, alertes, abonnes
- Page rappels: 3 categories (Hydratation/Traitements/Alarmes) avec illustrations 3D, detail par categorie, selecteur frequence jours
- Profil: glassmorphisme sur toutes les sections, bouton noir deconnexion
- Alertes: cartes glass, filtres noirs
- Login: noir & blanc, glass inputs
- Sante: cartes metrics, liens ECG/Sommeil
- Cleanup 1617 → 3 alertes (1 SOS + 1 Chute + 1 Anomalie)
- Mode light par defaut

## Backlog
- P1: Escalation → Intervenant Care quand aucun gardien ne repond
- P1: Flow invitation gardien frontend
- P2: Pages detail sante avec graphiques 7 jours + seuils d'alertes (comme les screenshots)
- P2: Theming glass complet sur ecrans secondaires restants (backoffice, devices, teleconsult, vest-connect, etc.)
- P3: Build natif Android/iOS
- P3: Integration complete bracelet J-Style
- P3: Balance Lefu
- BLOQUE: Shopify (plan insuffisant)
