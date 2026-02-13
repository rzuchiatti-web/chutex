# CHUTEX - Teleassistance & Telesante Application

## Problem Statement
Application de teleassistance et telesante "CHUTEX" pour le suivi des personnes agees/vulnerables avec 4 roles.

## Architecture
- **Frontend**: React Native / Expo / Expo Router (TypeScript)
- **Backend**: FastAPI (Python) - MongoDB - JWT Auth

## Design System
- **Palette**: Noir & Blanc uniquement, fond beige chaud (#F5F0EB), glassmorphisme
- **Cartes**: Glassmorphism (backdrop-blur, bordures semi-transparentes)
- **Boutons**: Noirs arrondis (pill shape), uppercase, bold
- **Badges sante**: Vert "BONNE SANTE" (#C8E6C9)
- **Illustrations 3D**: Coeur, globules rouges, lune, thermometre
- **Categories sante**: Cardiaque, Sanguine, Sommeil, Physique

## Session 5 (Feb 12-13, 2026) - REDESIGN V2
- Redesign complet noir & blanc + glassmorphisme
- Dashboard beneficiaire avec illustrations 3D medicales
- Dashboard gardien style carte beneficiaire avec badges
- Mode light par defaut (fond beige chaud)
- Cleanup 1617 -> 3 alertes (1 SOS + 1 Chute + 1 Anomalie)
- KPI admin sur dashboard principal

## Backlog
- P0: Completer theming ecrans secondaires
- P1: Flow invitation gardien frontend
- P1: Escalation → Intervenant Care quand aucun gardien ne repond
- P2: Integration complete bracelet J-Style
