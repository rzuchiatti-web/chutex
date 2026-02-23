# Processus d'Alerte — Schema Complet

## 1. DETECTION DE L'ALERTE

```
[Dispositifs BLE]          [Bouton SOS]          [IA Nora]
     |                          |                     |
     v                          v                     v
Bracelet Elio             Appui manuel           Analyse des
(chute, FC anormale,      sur le dashboard       donnees de sante
SpO2 basse, temp)                                (seuils depasses)
     |                          |                     |
     +----------+---------------+---------------------+
                |
                v
        POST /api/alerts
        {
          alert_type: "fall"|"sos"|"heart_rate"|"spo2"|"temperature",
          severity: "critical"|"high"|"medium",
          message: "Description de l'alerte",
          device_type: "bracelet"|"vest"|"manual",
          vitals: { heart_rate, spo2, temperature, ... }
        }
```

## 2. CREATION ET STOCKAGE

```
                    MongoDB: alerts
                    +----------------------------------+
                    | id: uuid                         |
                    | user_id: beneficiary_id          |
                    | alert_type: string               |
                    | severity: critical/high/medium    |
                    | status: "active"                 |
                    | message: string                  |
                    | vitals: { ... }                  |
                    | created_at: datetime             |
                    | location: { lat, lng }           |
                    +----------------------------------+
```

## 3. NOTIFICATION EN CASCADE

```
Alerte Creee
     |
     v
+----+-------------------------------+
|    NOTIFICATION SIMULTANEE         |
+------------------------------------+
|                                    |
v                                    v
[Gardiens/Aidants]            [Teleassistance IA]
                                     |
- Push notification               Appel vocal
- Dashboard gardien               automatique au
  (carte rouge "X alertes")       beneficiaire
- Fiche alerte detaillee          pour evaluer
  avec vitaux en temps reel       la situation
                                     |
                                     v
                              +------+--------+
                              | Evaluation IA |
                              | de la gravite |
                              +------+--------+
                                     |
                          +----------+----------+
                          |                     |
                          v                     v
                    [Fausse alerte]      [Alerte confirmee]
                    Cloture auto        Envoi intervenant
```

## 4. FLUX DU GARDIEN

```
Gardien recoit la notification
     |
     v
Dashboard Gardien
  > Carte alerte rouge "2 Alertes - Active"
     |
     v (clic)
Page Alertes
  > Liste des alertes actives
  > Chaque alerte montre:
    - Type (chute, SOS, FC...)
    - Vitaux en temps reel
    - Localisation GPS
    - Heure de declenchement
     |
     v (clic sur une alerte)
Fiche Alerte Detaillee
  > Vitaux du moment de l'alerte
  > Historique des actions
  > Bouton "J'interviens"
  > Bouton "Appeler le beneficiaire"
  > Bouton "Appeler les secours"
     |
     v
POST /api/alerts/{id}/acknowledge
  ou
POST /api/alerts/{id}/close
```

## 5. RESOLUTION

```
+-------------------+    +-------------------+    +-------------------+
| Gardien intervient|    | Teleassistance    |    | SAMU/Pompiers     |
| "J'interviens"    |    | envoie intervenant|    | appeles si grave  |
+--------+----------+    +--------+----------+    +--------+----------+
         |                        |                        |
         +----------+-------------+------------------------+
                    |
                    v
           POST /api/alerts/{id}/close
           {
             closed_by_role: "guardian"|"teleassistance"|"admin",
             resolution_note: "Description de la resolution",
             closed_at: datetime
           }
                    |
                    v
           Alerte passe en status "resolved"
           Carte verte "Cloturee" sur le dashboard
           Rapport genere pour l'historique
```

## 6. SEUILS D'ALERTE AUTOMATIQUE

```
+-------------------------+------------------+------------------+
| Metrique                | Seuil Bas        | Seuil Haut       |
+-------------------------+------------------+------------------+
| Frequence cardiaque     | < 50 bpm         | > 120 bpm        |
| SpO2                    | < 90%            | -                |
| Temperature             | < 35°C           | > 38.5°C         |
| Tension systolique      | < 90 mmHg        | > 160 mmHg       |
| Tension diastolique     | < 60 mmHg        | > 100 mmHg       |
+-------------------------+------------------+------------------+

Les seuils sont personnalisables par beneficiaire
via GET/PUT /api/health/thresholds/{metric_id}
```

## 7. NORA IA DANS LE PROCESSUS

```
- Nora connait les alertes actives du patient
- Nora peut expliquer au beneficiaire ou gardien:
  > Pourquoi l'alerte s'est declenchee
  > Quelles donnees sont anormales
  > Quelles actions entreprendre
  > Si une consultation est necessaire
- Pour les gardiens, Nora accede aux donnees
  de TOUS les beneficiaires rattaches
```
