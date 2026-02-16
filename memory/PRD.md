# CARE WATCH — PRD

## App
Plateforme de teleassistance sante IA — 6 roles utilisateur.

## Etat actuel
Design **reset a zero** — wireframe neutre fonctionnel. Aucune DA appliquee. En attente de definition de la nouvelle Direction Artistique avec l'utilisateur.

## Fonctionnalites implementees
- Auth multi-role (Beneficiaire, Gardien, Teleassistance, Admin, Prescriber Company, Intervenant)
- Dashboards par role
- Systeme d'alertes SOS + dispatch IA
- Suivi vitaux (FC, SpO2, temperature, pas)
- Liaison gardien/beneficiaire avec relation
- Push notifications
- Recommandations IA
- Rappels (hydratation, medicaments, alarmes)
- Teleconsultation
- Gestion appareils (bracelet, gilet)
- Classement prescripteurs + recompenses
- Back-office admin
- Multi-langue (FR, EN, DE, ES, IT)
- Onboarding

## Issues connues
1. Lefu Scale BLE (P1) — 30+ metriques non fonctionnelles
2. Backend permanent natif (P2) — TestFlight sans URL fixe
3. Build iOS fragile (P3)

## Prochaine etape
Definir la nouvelle DA avec l'utilisateur puis l'implementer.
