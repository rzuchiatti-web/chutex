# Documentation Technique pour Brevet
## Methode d'Estimation Non-Invasive de la Glycemie par Combinaison Multi-Capteurs et Intelligence Artificielle

**Deposant**: Chutex Innovation SAS
**Date de redaction**: Fevrier 2026
**Version**: 1.0 (Algorithme V1 + Architecture ML V2/V3)

---

## 1. Domaine de l'invention

L'invention concerne un systeme et une methode d'estimation non-invasive du taux de glucose sanguin (glycemie) chez un sujet, combinant des donnees multi-capteurs portables avec un algorithme d'apprentissage automatique.

## 2. Probleme technique resolu

La mesure de la glycemie necessite aujourd'hui un prelevement sanguin (piqure capillaire ou prise de sang). Les capteurs transcutanes (CGM) sont invasifs et couteux. Il n'existe pas de methode fiable non-invasive disponible grand public.

L'invention propose une methode d'estimation du risque glycemique basee sur la correlation entre plusieurs parametres physiologiques mesurables de maniere non-invasive.

## 3. Etat de l'art et bases scientifiques

L'algorithme repose sur les correlations scientifiques suivantes :

| Parametre | Correlation avec la glycemie | Reference |
|---|---|---|
| Variabilite de la frequence cardiaque (HRV) | Correlation inverse avec la resistance a l'insuline | Frontiers in Endocrinology, 2019 |
| Frequence cardiaque au repos | Correlation positive avec la glycemie a jeun | Diabetes Care, 2016 |
| Graisse viscerale | Predicteur le plus fort du diabete de type 2 | Diabetologia, 2012 |
| SpO2 | Les desaturations nocturnes correlees avec la dysregulation du glucose | Sleep Medicine Reviews, 2020 |
| Qualite du sommeil | Mauvais sommeil = augmentation de la resistance a l'insuline | Lancet Diabetes & Endocrinology, 2015 |
| IMC / Masse grasse | Relation directe avec le risque metabolique | OMS, donnees epidemiologiques |
| Activite physique | L'exercice reduit la glycemie post-prandiale | American Diabetes Association |

## 4. Description de l'invention

### 4.1 Architecture du systeme

```
[Bracelet Elio V6] ----BLE/4G----> [Backend Chutex]
       |                                   |
  Capteurs:                          Algorithme:
  - PPG (photoplethysmographie)      - V1: Score de risque (formules)
  - Accelerometre                    - V2: Calibre (piqure capillaire)
  - Temperature cutanee              - V3: ML (reseau neuronal)
  - Oxymetre de pouls                       |
                                     [MongoDB]
[Balance Vita 8 electrodes] --BLE-->   |
       |                           Stockage:
  Capteurs:                        - Donnees capteurs horodatees
  - Impedancemetrie segmentaire    - Calibrations glycemie capillaire
  - Poids / IMC                    - Profil medical utilisateur
  - Graisse viscerale              - Historique pour entrainement ML
  - Masse musculaire
```

### 4.2 Algorithme V1 — Score de risque (implementation actuelle)

**Entrees** :
1. HRV (ms) — via bracelet BLE (intervalle R-R)
2. Frequence cardiaque au repos (bpm) — via bracelet
3. SpO2 (%) — via oxymetre de pouls bracelet
4. Activite physique (pas/jour) — via accelerometre
5. Qualite du sommeil (%) — via analyse des mouvements nocturnes
6. Temperature corporelle — via capteur cutane
7. Stress (score 0-100) — derive du HRV
8. Graisse viscerale (indice) — via impedancemetrie balance
9. IMC — via balance + profil
10. Masse grasse (%) — via impedancemetrie
11. Masse musculaire (%) — via impedancemetrie
12. Hydratation (%) — via impedancemetrie
13. Age, sexe — profil utilisateur
14. Conditions medicales connues — profil utilisateur

**Algorithme de calcul** :

Pour chaque parametre disponible, un score de risque partiel est attribue selon des seuils cliniques valides :

```python
risk_score = 0
data_points = 0

# HRV (poids: 25 pts max — facteur le plus important)
if hrv > 0:
    data_points += 1
    if hrv < 20: risk_score += 25
    elif hrv < 30: risk_score += 15
    elif hrv < 50: risk_score += 8
    else: risk_score += 2

# FC repos (poids: 18 pts max)
if hr_rest > 0:
    data_points += 1
    if hr_rest > 90: risk_score += 18
    elif hr_rest > 80: risk_score += 12
    elif hr_rest > 72: risk_score += 6
    else: risk_score += 2

# Graisse viscerale (poids: 22 pts max — 2e facteur)
if visceral_fat > 0:
    data_points += 1
    if visceral_fat > 15: risk_score += 22
    elif visceral_fat > 12: risk_score += 15
    elif visceral_fat > 9: risk_score += 8
    else: risk_score += 2

# [Autres facteurs: IMC, masse grasse, SpO2, sommeil, activite, age]
# ... voir code source complet dans glycemia_routes.py
```

**Normalisation** :
```
normalized_risk = min(100, (risk_score / (data_points * 25)) * 100)
```

**Zones de resultat** :
- `< 35` : Zone normale (0.70 - 1.00 g/L)
- `35 - 60` : Zone de vigilance (1.00 - 1.26 g/L)
- `> 60` : Zone d'alerte (> 1.26 g/L)

**Confiance** :
```
confidence = min(95, 30 + (data_points * 8))
```

### 4.3 Systeme de calibration (V2 planifie)

Le systeme integre un mecanisme de calibration par mesure capillaire :

1. L'utilisateur effectue une glycemie capillaire (piqure au doigt)
2. La valeur reelle est saisie dans l'application
3. Le systeme associe cette valeur aux donnees capteurs du moment
4. L'offset entre estimation et realite est calcule et applique comme correction

```python
calibration_offset = expected_risk_from_real_value - current_estimated_risk
adjusted_risk = normalized_risk + calibration_offset * 0.7
```

Les calibrations sont stockees dans une collection MongoDB dediee :
```json
{
    "user_id": "...",
    "glycemia_value": 1.05,
    "unit": "g/L",
    "date": "2026-02-15T08:30:00Z",
    "source": "manual_capillary"
}
```

### 4.4 Architecture ML V3 (planifiee)

L'objectif final est un modele de Machine Learning entraine sur les donnees reelles :

**Donnees d'entrainement** (par utilisateur) :
- Vecteur de features temporelles : PPG brut (forme d'onde), HRV (RMSSD, SDNN, pNN50), FC, SpO2, temperature, impedancemetrie (toutes les composantes segmentaires)
- Label : glycemie capillaire reelle (horodatee)
- Contexte : heure, repas recents, activite, sommeil

**Modele propose** :
- Architecture : LSTM + Attention temporelle
- Entree : fenetre glissante de 30 min de donnees PPG + derniere impedancemetrie
- Sortie : estimation glycemie (g/L) + intervalle de confiance
- Calibration personnalisee : fine-tuning par utilisateur (transfer learning)
- Taille d'echantillon cible : > 1000 paires (capteurs, glycemie reelle) par utilisateur pour convergence

**Innovation cle** : La combinaison PPG (bracelet) + impedancemetrie multi-segmentaire (balance 8 electrodes) est unique. L'impedancemetrie fournit les donnees de composition corporelle (graisse viscerale, hydratation) qui sont fortement correlees au metabolisme glucidique, tandis que le PPG en continu capture les variations hemodynamiques en temps reel.

## 5. Revendications

### Revendication 1 (Methode)
Methode d'estimation non-invasive de la glycemie d'un sujet, caracterisee en ce qu'elle comprend :
a) La mesure continue par un dispositif portable (bracelet) de la variabilite de la frequence cardiaque (HRV), de la frequence cardiaque au repos, de la saturation en oxygene (SpO2), et de la photoplethysmographie (PPG) ;
b) La mesure periodique par un dispositif d'impedancemetrie (balance connectee) de la graisse viscerale, de la masse grasse, de la masse musculaire, et de l'hydratation ;
c) Le calcul d'un score de risque glycemique par combinaison ponderee desdites mesures ;
d) La categorisation dudit score en zones de risque (normale, vigilance, alerte) avec intervalle de confiance ;
e) La possibilite de calibration par saisie de glycemies capillaires reelles pour ameliorer la precision individuelle.

### Revendication 2 (Systeme)
Systeme comprenant un bracelet connecte equipe d'un capteur PPG, d'un oxymetre de pouls, et d'un accelerometre, communiquant via BLE et/ou 4G avec un serveur applicatif ; une balance connectee a impedancemetrie 8 electrodes communicant via BLE ; et un serveur applicatif executant l'algorithme de la revendication 1.

### Revendication 3 (ML)
Extension de la revendication 1 ou le score de risque est calcule par un modele d'apprentissage automatique (LSTM + Attention) entraine sur les paires (donnees capteurs, glycemie capillaire reelle) specifiques a chaque utilisateur.

## 6. Avantages de l'invention

1. **Non-invasif** : Aucune piqure necessaire pour l'estimation quotidienne
2. **Multi-capteurs** : Combine bracelet (hemodynamique) + balance (composition corporelle) pour une estimation plus robuste que les approches mono-capteur
3. **Calibration individualisee** : S'adapte a chaque patient via les mesures capillaires periodiques
4. **ML evolutif** : L'algorithme s'ameliore avec le temps grace a l'accumulation de donnees
5. **Infrastructure de donnees** : Architecture concue pour collecter et stocker les donnees en vue de l'entrainement ML

## 7. Implementation technique

- **Backend** : FastAPI (Python) avec MongoDB
- **Endpoints** :
  - `GET /api/glycemia/estimate` : Estimation en temps reel
  - `POST /api/glycemia/calibrate` : Saisie calibration capillaire
  - `GET /api/glycemia/calibrations` : Historique des calibrations
  - `POST /api/bracelet/v6/push` : Reception donnees V6 (incluant PPG brut)
- **Stockage** : MongoDB collections `device_readings` (capteurs), `glycemia_calibrations` (calibrations), `users` (profil medical)
- **Frontend** : React (Expo) avec page detail glycemie (`glycemia-detail.tsx`)

## 8. Annexes

### A. Code source de l'algorithme V1
Voir `/app/backend/routes/glycemia_routes.py`

### B. Schema BLE V6
Voir `/app/backend/routes/bracelet_routes.py` (section V6_BLE_CONFIG)

### C. Collection de donnees ML
Chaque paire (capteurs, glycemie capillaire) est stockee avec horodatage et contexte complet, prete pour l'entrainement du modele V3.
