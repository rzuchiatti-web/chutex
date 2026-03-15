# CHUTEX CARE — Cahier des Charges Resume

## Vision
Application de teleassistance et suivi sante pour personnes agees, avec bracelet connecte 4G, balance connectee, gilet airbag anti-chute, et IA "Nora" pour accompagnement personnalise.

---

## Architecture Technique
- **Frontend** : React Native (Expo) — rendu web + mobile
- **Backend** : FastAPI (Python) + MongoDB
- **IA** : OpenAI GPT-5.2 via Emergent LLM Key (assistant "Nora")
- **Integrations** : Lefu Cloud (balance), Mollie (paiement), VAPI.ai (appels vocaux), Mailjet (emails), SMSMode (SMS), ElevenLabs (TTS), Shopify (e-commerce)

---

## 5 Roles Utilisateur

| Role | Description |
|---|---|
| **Beneficiaire** | Personne agee equipee (bracelet, balance, gilet) |
| **Gardien** | Proche/aidant qui surveille un ou plusieurs beneficiaires |
| **Teleassistance** | Operateur centre d'appels / urgences |
| **Prescripteur (Company)** | Structure SAAD / prescripteur medical |
| **Admin** | Back-office Chutex |

---

## ESPACE BENEFICIAIRE

### Page : Onboarding (`/onboarding`)
- 5 ecrans de presentation de l'app (swipe)
- Stockage local pour ne pas re-afficher

### Page : Inscription (`/register`)
- Inscription multi-etapes :
  1. Choix du role (beneficiaire / gardien)
  2. Telephone + mot de passe
  3. Verification SMS
  4. Informations personnelles (nom, prenom, date naissance, genre, adresse)
  5. Informations medicales (taille, poids, groupe sanguin, pathologies, allergies)
  6. Antecedents medicaux
  7. Consentement RGPD
  8. Code SAAD (optionnel, pour rattachement structure)
  9. Presentation de Nora (IA)

### Page : Connexion (`/index`)
- Login par telephone + mot de passe
- Redirection selon role

### Page : Morning Briefing (`/morning-briefing`)
- Analyse IA quotidienne de l'etat de sante
- Message personnalise de Nora
- Objectifs du jour (calories, hydratation, pas, heure coucher)
- Slider "Glisser pour continuer"

### Page : Dashboard (`/(tabs)/index`)
- **Header** : Nom, role, drapeaux langue, notifications, appel SOS
- **Bouton SOS** : Appui urgence → creation alerte + appel teleassistance
- **Banniere alertes** : Alertes actives avec status
- **Constantes vitales** : FC, SpO2, temperature, pas, calories, HRV (temps reel du bracelet)
- **Activite / Sommeil** : Resume quotidien
- **Objectif poids** : Progression vers objectif (si configure)
- **Carte Nora** : Acces rapide a l'IA
- **Dispositifs** : Liste des appareils connectes (bracelet, balance, gilet) avec batterie + bouton `+`
- **Rappels** : Hydratation, traitement, alarmes (CRUD complet)
- **Mes gardiens** : Liste des gardiens lies + ajout
- **Teleconsultation** : Acces medecin 24/7
- Mode **clair / sombre** avec toggle

### Page : Sante (`/(tabs)/health`)
- **Age biologique** : Score "Bio Age" avec pilule Nora IA
- **Vitesse vieillissement** : Estimation (simulee)
- **Sections sante** :
  - Cardiaque (FC, HRV)
  - Respiratoire (SpO2)
  - Temperature
  - Activite physique (pas, distance, calories)
  - Sommeil (duree, phases, qualite, hypnogramme)
  - Glycemie (estimation V2 par algorithme multi-facteurs)
  - Poids / IMC
- **Objectifs quotidiens** : Calories, hydratation, pas, sommeil
- **Boutons action** : Nouvelle pesee, Nouvel ECG (ronds, blancs)
- Mode clair / sombre

### Page : Detail metrique (`/metric-detail`)
- Historique graphique d'une constante
- Seuils personnalisables (min/max/objectif)
- Conseil IA Nora

### Page : Detail glycemie (`/glycemia-detail`)
- Estimation glycemique V2 (multi-facteurs : FC, HRV, activite, sommeil, poids, calibrations)
- Historique tendances
- Calibrations manuelles (glycemie reelle mesuree)

### Page : Sommeil (`/sleep`)
- Hypnogramme detaille
- Phases sommeil (profond, leger, REM, eveil)
- Score qualite
- Historique 7 jours

### Page : ECG (`/ecg`)
- Demarrage ECG via bracelet
- Resultats : FC, variabilite, anomalies detectees
- Historique ECG

### Page : Programmes (`/(tabs)/chat`)
- **Catalogue programmes** : Equilibre, Mobilite, Nutrition, Sommeil, Memoire, Social...
- **Programme actif** : Vue jour par jour avec taches
- **Check-in quotidien** : Humeur, douleur, fatigue, adherence
- **Badges** : Recompenses par progression
- **Rapport hebdomadaire** : Resume partageable
- **Equipes** : Programmes en equipe avec invitations

### Page : Detail programme (`/program-detail`)
- Description, duree, difficulte, prerequis
- Bouton demarrer/reprendre

### Page : Dorsi (`/dorsi-bilan`, `/dorsi-program`, `/dorsi-game`)
- **Bilan postural** : Questionnaire evaluation dos/posture
- **Programme personnalise** : Sessions d'exercices generes selon le bilan
- **Jeux** : Mini-jeux posturaux
- **Indice Dorsi** : Score posture global
- **Streaks** : Series de jours consecutifs

### Page : Minceur (`/minceur`)
- **Objectif poids** : Definition et suivi
- **Plan nutritionnel** : Recommandations IA (calories, macros)
- **Exercices quotidiens** : Adaptes au profil
- **Tracking** : Repas, hydratation, activite

### Page : Detail repas (`/meal-detail`)
- Recette detaillee avec etapes illustrees
- Ingredients, temps preparation, valeurs nutritionnelles

### Page : Dispositifs (`/(tabs)/devices`)
- **Gestion appareils** :
  - Bracelet Elio (BLE) : Appairage, status, batterie
  - Balance Vita (WiFi/BLE) : Appairage, pesees
  - Gilet Elder : Appairage, airbag status
- **Flux appairage** : Guide etape par etape avec animations
- **Historique pesees** : Graphique + rapports

### Page : Connexion bracelet (`/bracelet-connect`)
- Interface BLE appairage bracelet Elio

### Page : Connexion gilet (`/vest-connect`)
- Interface BLE appairage gilet Elder

### Page : Abonnement (`/subscription`)
- Plans : Standard, Premium
- Integration Mollie/Shopify pour paiement
- Gestion facturation

### Page : Alertes (`/(tabs)/alerts`)
- Liste des alertes (chute, depassement seuils, SOS)
- Status : Active, En cours, Cloturee

### Page : Detail alerte (`/alert-detail`)
- Timeline complete : detection → appel → intervention → resolution
- Carte localisation
- Constantes au moment de l'alerte
- Gardiens notifies
- Rapport intervention

### Page : Chat Nora (`/chat-ia`)
- Conversation IA avec contexte sante complet
- Cache reponses pour optimiser couts
- Historique conversations

### Page : Profil (`/(tabs)/profile`)
- Informations personnelles (edition)
- Preferences (langue, notifications, theme)
- Data sharing : Controle donnees partagees avec gardiens
- RGPD : Demandes portabilite/suppression
- Geofencing : Zones de securite
- Seuils alertes personnalises
- Deconnexion

### Page : Geofencing (`/geofencing`)
- Creation zones securite (cercle sur carte)
- Alertes si sortie de zone

### Page : Partage donnees (`/data-sharing`)
- Choix granulaire : vitaux, localisation, alertes, medicaments, appareils, rapports

### Page : Seuils alertes (`/edit-thresholds`)
- Personnalisation seuils min/max pour chaque metrique

### Page : Rappels (`/reminders`)
- CRUD rappels : Hydratation, Traitement, Alarmes
- Jours, heures, frequence

---

## ESPACE GARDIEN

### Dashboard Gardien (`/(tabs)/index` - role guardian)
- **Liste beneficiaires** lies avec status
- **Alertes actives** des beneficiaires
- **Invitations** en attente (SAAD, gardien)
- **Interventions** en cours

### Page : Detail beneficiaire (`/beneficiary-detail`)
- **Carte profil** structuree :
  - Identite (age, genre, date naissance, telephone)
  - Adresse
  - Physique (taille, poids, IMC)
  - Dossier medical (groupe sanguin, pathologies, allergies)
- **Analyse Nora** : Resume IA des constantes
- **Constantes vitales** : FC, SpO2, temperature, pas, calories, HRV
- **Dispositifs** : Bracelet, Balance, Gilet
- Lien vers page sante complete (lecture seule)

### Page : Sante lecture seule (`/health-readonly`)
- Dashboard sante complet du beneficiaire (lecture uniquement)

### Page : Prescriptions (`/(tabs)/devices` - role guardian)
- Gestion prescriptions : creation, envoi, suivi
- Activation espace prescripteur via code

### Page : Interventions (`/(tabs)/teleconsult` - role guardian)
- Liste interventions en cours
- Accepter/refuser intervention
- Suivi en temps reel (carte + tracking)

### Navigation Gardien (Whoop-style)
- Accueil | Interventions | Prescriptions | Plus
- Bouton Nora circulaire flottant

---

## ESPACE TELEASSISTANCE

### Dashboard Teleassistance (`/(tabs)/index` - role teleassistance)
- **Abonnes** : Liste tous les beneficiaires du centre
- **Alertes actives** : Monitoring temps reel
- **Escalades** : Gestion chaine d'appels urgence

### Flux Teleassistance
1. Alerte recue (chute, SOS, seuil depasse)
2. Appel automatique beneficiaire (VAPI.ai / Twilio)
3. Protocole questions pre-etabli
4. Si besoin : appel gardiens en cascade
5. Si besoin : escalade → SAMU / pompiers
6. Intervention terrain (intervenant le plus proche)
7. Rapport + cloture

### Page : Detail alerte (`/alert-detail`)
- Timeline complete avec enregistrements appels
- Actions : Resoudre, Escalader, Appeler

### Page : Visite intervenant (`/intervenant-visit`)
- Donnees sante du beneficiaire pour l'intervenant terrain
- Ajout observations
- Historique visites

---

## ESPACE PRESCRIPTEUR / COMPANY

### Dashboard Company (`/(tabs)/index` - role prescriber_company)
- **Agences** : Gestion multi-agences
- **Prescripteurs** : Affectation par agence
- **Intervenants** : Gestion equipe terrain
- **Gardiens** : Liens gardiens-beneficiaires
- **Statistiques** : KPIs (alertes, interventions, abonnes)

### Page : Agences (`/company-agency`)
- CRUD agences (nom, adresse, responsable)
- Affectation prescripteurs et intervenants

### Page : Detail prescripteur (`/company-prescriber-detail`)
- Profil, beneficiaires, prescriptions emises

### Page : Detail intervenant (`/company-intervenant-detail`)
- Profil, interventions, zone d'action

### Page : Detail intervention (`/company-intervention-detail`)
- Suivi complet d'une intervention

### Page : Prescriptions Company
- Liste toutes les prescriptions
- Filtres, export

---

## ESPACE ADMIN (Back-office)

### Dashboard Admin (`/(tabs)/index` - role admin)
- **Statistiques globales** : Utilisateurs, alertes, interventions, abonnements
- **Utilisateurs** : Recherche, filtres, detail complet
- **Alertes** : Monitoring global
- **Codes activation** : CRUD codes prescripteur + codes intervention
- **Codes intervention** : Gestion societes intervention avec rayon d'action
- **Donnees systeme** : Metriques techniques

### Page : Detail utilisateur (`/admin-client-detail`)
- Profil complet, appareils, abonnement, historique

### Page : Detail prescription (`/admin-prescription-detail`)
- Suivi prescription de bout en bout

---

## FONCTIONNALITES TRANSVERSALES

### Nora — Assistant IA
- **Chat** : Conversation contextuelle (sante, medicaments, conseils)
- **Morning Briefing** : Analyse quotidienne avec objectifs
- **Analyses ponctuelles** : Resume beneficiaire pour gardiens
- **Recommandations** : Dorsi, Minceur, exercices
- **TTS** : Synthese vocale (ElevenLabs)
- **Optimisation** : Cache + prompt engineering pour reduire couts API

### Systeme d'Alertes
- **Types** : Chute, SOS manuel, seuil depasse (FC, SpO2, temp), sortie zone
- **Chaine** : Detection → Notification → Appel → Escalade → Intervention → Rapport
- **Geofencing** : Zones securite avec alertes sortie
- **Sedentarite** : Alerte inactivite prolongee

### Abonnements
- Plans : Standard, Premium
- Integration Mollie (paiement)
- Integration Shopify (commandes appareils)
- Gestion via back-office admin

### Programmes Prevention
- 9+ programmes : Equilibre, Mobilite, Nutrition, Sommeil, Memoire, Social, Cardio, Respiration, Gestion stress
- Systeme jour par jour avec taches
- Check-in quotidien (humeur, douleur, fatigue)
- Badges et recompenses
- Rapports hebdomadaires partageables
- Mode equipe (invitations, classement)

### Dorsi (Posture)
- Bilan postural auto-evaluation
- Programme exercices personnalise
- Mini-jeux posturaux
- Indice Dorsi (score global)
- Streaks (series)

### Minceur (Poids)
- Objectif poids avec timeline
- Plan nutritionnel IA (calories Mifflin-St Jeor)
- Recettes detaillees
- Exercices quotidiens adaptes
- Tracking repas/hydratation

### Glycemie (Estimation V2)
- Algorithme multi-facteurs (FC, HRV, activite, sommeil, poids)
- Calibrations manuelles
- Tendances
- *Note : estimation, pas mesure medicale*

### RGPD & Conformite
- Consentement granulaire (inscription)
- Demandes portabilite/suppression
- Politique de confidentialite, CGU, mentions legales
- Partage donnees configurable

### Notifications
- Push web (service worker)
- SMS (SMSMode)
- Email (Mailjet)
- Appels vocaux (VAPI.ai / Twilio)

### Internationalisation
- Francais (principal)
- Support multi-langue (i18n context)

---

## APPAREILS CONNECTES

| Appareil | Connexion | Donnees |
|---|---|---|
| **Bracelet Elio** | BLE / 4G | FC, SpO2, temperature, pas, calories, HRV, sommeil, chute |
| **Balance Vita** | WiFi / BLE (Lefu) | Poids, impedance, masse grasse, masse musculaire |
| **Gilet Elder** | BLE | Detection chute, airbag, status |

---

## DONNEES SIMULEES (non reelles)
- Age biologique / vitesse vieillissement
- Estimation glycemie (V2, pas mesure reelle)
- Donnees sommeil detaillees (phases)
- Certaines constantes vitales (si bracelet non connecte)

---

## COMPTES TEST

| Role | Telephone | Mot de passe |
|---|---|---|
| Beneficiaire | 0651245918 | test123 |
| Gardien 1 | +33689896539 | test123 |
| Gardien 2 | +33619559380 | test123 |
| Gardien (Marie) | +33699887766 | test123 |

---

## TACHES FUTURES (Backlog)
- True ML Glycemie (V3) — modele prediction reel
- Systeme parrainage Guardian
- Essai gratuit 7 jours
- Visualisation contrat PDF
- Integration Vivoo (test urinaire)
- Correlations sante UI
- Documentation algo glucose (brevet)
- Integration bracelet V6 4G (firmware en attente)
