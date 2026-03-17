from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os
import uuid

from database import db
from auth import get_current_user

router = APIRouter()

import re

def enrich_tasks_interactive(tasks: list, program_category: str = "") -> list:
    """Auto-detect interactive types for each task based on text patterns.
    Returns a list of interactive configs parallel to the tasks list."""
    interactive = []
    for i, task in enumerate(tasks):
        t = task.lower() if isinstance(task, str) else ""

        # Breathing exercises
        if re.search(r'(coherence cardiaque|respir.*(4.?7.?8|5.?5|profonde)|body scan|relaxation progressive|pleine conscience)', t):
            pattern = "4-7-8" if "4" in t and "7" in t and "8" in t else "5-5"
            dur = 300
            m = re.search(r'(\d+)\s*min', t)
            if m: dur = int(m.group(1)) * 60
            interactive.append({"type": "breathing", "pattern": pattern, "duration_sec": dur, "icon": "ri-lungs-line", "label": "Exercice de respiration"})

        # Timer exercises (walking, stretching, yoga, etc.)
        elif re.search(r'(\d+)\s*min.*?(marche|etir|yoga|tai.?chi|circuit|exercice|meditation|natation|velo|nage)', t) or \
             re.search(r'(marche|etir|yoga|tai.?chi|circuit|exercice|meditation|natation|velo|nage).*?(\d+)\s*min', t):
            dur = 0
            m = re.search(r'(\d+)\s*min', t)
            if m: dur = int(m.group(1)) * 60
            is_physical = re.search(r'(marche|squat|circuit|genoux|talons|pompe|lever|escalier)', t)
            icon = "ri-footprint-line" if is_physical else "ri-timer-line"
            label = "Chronometre"
            interactive.append({"type": "timer", "duration_sec": dur, "icon": icon, "label": label})

        # Data input (measurements, ratings, logging)
        elif re.search(r'(heure.*(coucher|reveil|lever)|mesurez.*tension|pesez.vous|notez.*(heure|valeur|poids|tension)|dans l.app)', t):
            field = "generic"
            input_type = "text"
            if "coucher" in t: field, input_type = "bedtime", "time"
            elif "reveil" in t or "lever" in t: field, input_type = "wake_time", "time"
            elif "tension" in t: field, input_type = "blood_pressure", "text"
            elif "poids" in t or "pesez" in t: field, input_type = "weight", "number"
            interactive.append({"type": "data_input", "field": field, "input_type": input_type, "icon": "ri-edit-line", "label": "Enregistrer"})

        # Quiz / knowledge questions (evaluation days, bilan)
        elif re.search(r'(evaluez|comparez.*jour.*vs|bilan|noter.*sur 5|notez.*impact)', t):
            interactive.append({"type": "rating", "max": 5, "icon": "ri-star-line", "label": "Evaluer"})

        # Physical reps (squats, push-ups, etc.)
        elif re.search(r'(\d+)\s*(squats?|pompes?|lever|montee|flexion|repet|serie)', t):
            reps = 0
            m = re.search(r'(\d+)', t)
            if m: reps = int(m.group(1))
            interactive.append({"type": "counter", "target": reps, "icon": "ri-repeat-line", "label": f"{reps} repetitions"})

        # Balance exercises
        elif re.search(r'(tenez.*pied|equilibre|talon.pointe|proprioception)', t):
            dur = 30
            m = re.search(r'(\d+)\s*seconde', t)
            if m: dur = int(m.group(1))
            interactive.append({"type": "timer", "duration_sec": dur, "icon": "ri-walk-line", "label": "Exercice d'equilibre"})

        # Default: simple action
        else:
            interactive.append({"type": "action", "icon": "ri-check-line", "label": "Valider"})

    return interactive

# ─── Seed programs on import ───
SEED_PROGRAMS = [
    {
        "id": "prog-sleep-21",
        "title": "21 jours pour mieux dormir",
        "subtitle": "Programme scientifique pour transformer vos nuits",
        "icon": "ri-moon-line",
        "color": "#A78BFA",
        "duration_days": 21,
        "category": "sommeil",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur les dernieres recherches en chronobiologie et medecine du sommeil. 3 phases progressives : installer l'hygiene du sommeil (semaine 1), optimiser l'environnement et la nutrition (semaine 2), personnaliser et ancrer vos acquis (semaine 3). Chaque jour est concu pour agir sur un levier scientifiquement prouve.",
        "benefits": [
            "Amelioration de la qualite du sommeil profond (+15-25% selon les etudes)",
            "Reduction du temps d'endormissement (latence de sommeil)",
            "Stabilisation du rythme circadien",
            "Diminution du stress et de l'anxiete nocturne",
            "Meilleure recuperation physique et cognitive",
        ],
        "data_used": ["Qualite du sommeil", "Duree du sommeil", "Phases de sommeil", "Frequence cardiaque au repos", "HRV", "Niveau de stress"],
        "medical_disclaimer": "Ce programme ne remplace pas un avis medical. Si vous souffrez d'apnee du sommeil, d'insomnie chronique ou de troubles du sommeil diagnostiques, consultez votre medecin.",
        "onboarding_fields": [
            {"key": "bedtime_current", "label": "A quelle heure vous couchez-vous en general ?", "type": "time"},
            {"key": "wake_time", "label": "A quelle heure souhaitez-vous vous reveiller ?", "type": "time"},
            {"key": "goal", "label": "Votre objectif principal", "type": "choice", "options": ["M'endormir plus vite", "Dormir plus profondement", "Arreter les reveils nocturnes", "Avoir un sommeil plus regulier", "Reduire la fatigue au reveil"]},
            {"key": "sleep_quality", "label": "Comment evaluez-vous votre sommeil actuel ?", "type": "rating", "max": 5},
            {"key": "caffeine", "label": "Consommez-vous du cafe ou du the apres 14h ?", "type": "yesno"},
            {"key": "screens", "label": "Utilisez-vous des ecrans moins d'1h avant le coucher ?", "type": "yesno"},
        ],
        "tracked_metrics": ["sleep_quality", "sleep_duration_min", "deep_sleep_min", "heart_rate", "hrv", "stress_level"],
        "phases": [
            {"name": "Hygiene du sommeil", "days": [1, 7], "description": "Installer les fondamentaux : regularite, rituels, reduction des stimulants", "color": "#A78BFA"},
            {"name": "Environnement & Nutrition", "days": [8, 14], "description": "Optimiser chambre, lumiere, temperature, alimentation pro-sommeil", "color": "#818CF8"},
            {"name": "Personnalisation", "days": [15, 21], "description": "Ancrer les habitudes, gerer les micro-reveils, preparer l'apres-programme", "color": "#6366F1"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Fixer votre heure de coucher", "mission": "La regularite de l'heure de coucher est le facteur n.1 de la qualite du sommeil (etude Walker, 2017). Le noyau suprachiasmatique, votre horloge biologique, fonctionne par habitude.", "tasks": ["Determinez votre heure de coucher ideale (calculez 7h30 avant votre reveil)", "Programmez un rappel 30 minutes avant cette heure", "Ce soir, couchez-vous a cette heure exacte et notez l'heure"], "tip": "Etude : les personnes avec une heure de coucher reguliere ont 25% de sommeil profond en plus (Harvard Sleep Medicine, 2019)."},
            "2": {"focus": "Eliminer la lumiere bleue", "mission": "La lumiere bleue des ecrans inhibe la secretion de melatonine de 50% (etude Cajochen, 2011). Meme 30 min d'ecran avant le coucher retarde l'endormissement de 20 min en moyenne.", "tasks": ["Activez le mode nuit sur tous vos ecrans des 20h", "Eteignez les ecrans 1h avant le coucher", "Remplacez par la lecture, un podcast ou de la musique douce"], "tip": "La melatonine commence a etre secretee 2h avant le coucher naturel. La lumiere bleue bloque ce processus."},
            "3": {"focus": "Creer votre rituel du soir", "mission": "Un rituel pre-sommeil de 20-30 min signale au cerveau qu'il est temps de dormir. C'est le meme mecanisme que les routines de coucher des enfants — ca fonctionne a tout age.", "tasks": ["Choisissez 3 activites relaxantes (tisane, lecture, etirements, respiration)", "Pratiquez-les dans le meme ordre ce soir", "Evaluez votre relaxation sur 5 apres le rituel"], "tip": "Le tryptophane (present dans la banane, le lait, les noix) est un precurseur de la melatonine. Une tisane tilleul-camomille a des effets sedatifs prouves."},
            "4": {"focus": "Gerer la cafeine", "mission": "La cafeine a une demi-vie de 5 a 7 heures. Un cafe a 15h est encore actif a 50% a 21h. L'adenosine, molecule du sommeil, est bloquee par la cafeine.", "tasks": ["Pas de cafe, the noir ou energisant apres 14h", "Remplacez par du rooibos, de l'eau ou du the vert decafeine", "Notez votre heure de dernier cafe et votre facilite d'endormissement ce soir"], "tip": "Meme le chocolat noir contient de la cafeine (20mg pour 30g). Certaines personnes sont genetiquement plus sensibles (gene CYP1A2)."},
            "5": {"focus": "Bouger au bon moment", "mission": "L'exercice physique augmente le sommeil profond de 75% (meta-analyse Kredlow, 2015). Mais le timing compte : l'exercice intense le soir augmente la temperature corporelle et retarde l'endormissement.", "tasks": ["30 minutes de marche ou activite moderee en journee", "Pas de sport intense apres 18h", "10 minutes d'etirements doux le soir (cou, epaules, hanches)"], "tip": "Le sport matinal ou en debut d'apres-midi est ideal. L'augmentation de temperature du corps pendant l'effort, suivie d'une baisse, favorise l'endormissement."},
            "6": {"focus": "Reduire le cortisol du soir", "mission": "Le cortisol (hormone du stress) doit baisser le soir pour que la melatonine prenne le relais. Les ruminations mentales maintiennent un cortisol eleve, empechant l'endormissement.", "tasks": ["Ecrivez 3 choses positives de votre journee (journal de gratitude)", "5 minutes de coherence cardiaque (inspire 5s, expire 5s)", "Aucun sujet stressant (finances, travail, conflits) apres 20h"], "tip": "La coherence cardiaque a 6 respirations/min active le nerf vague et reduit le cortisol de 23% en 5 minutes (etude McCraty, 2009)."},
            "7": {"focus": "Bilan de la semaine 1", "mission": "Apres 7 jours, votre corps commence a integrer les nouveaux signaux. C'est le moment de consolider ce qui fonctionne et d'identifier ce qui peut etre ameliore.", "tasks": ["Comparez vos donnees de sommeil jour 1 vs aujourd'hui dans l'app", "Notez les 2 habitudes qui ont eu le plus d'impact", "Evaluez votre qualite de sommeil globale cette semaine sur 5"], "tip": "Si votre bracelet montre une amelioration du sommeil profond ou une baisse de la FC au repos, c'est un signe objectif de progres."},
            "8": {"focus": "Optimiser la temperature", "mission": "La temperature ideale pour dormir est 16-19C (National Sleep Foundation). Le corps doit baisser de 1C pour declencher le sommeil. C'est pourquoi on dort mieux dans une chambre fraiche.", "tasks": ["Reglez votre chambre a 18C (ou baissez de 2C vs d'habitude)", "Aerez 10 minutes avant de dormir", "Utilisez une couette adaptee a la saison (ni trop chaude, ni trop froide)"], "tip": "Un bain ou une douche chaude 1-2h avant le coucher accelere la baisse de temperature corporelle et raccourcit le temps d'endormissement de 36% (etude Haghayegh, 2019)."},
            "9": {"focus": "Obscurite et melatonine", "mission": "Meme une lumiere de 8 lux (veilleuse) reduit la secretion de melatonine. L'obscurite totale est le signal le plus puissant pour votre horloge biologique.", "tasks": ["Identifiez toutes les sources de lumiere dans votre chambre", "Utilisez des rideaux occultants ou un masque de sommeil", "Supprimez les veilleuses, LEDs d'appareils et ecrans en veille"], "tip": "La lumiere rouge/orange est la moins perturbatrice pour la melatonine. Si vous avez besoin d'une veilleuse pour la nuit, preferez une lumiere rouge tres faible."},
            "10": {"focus": "Maitriser le bruit", "mission": "Les bruits intermittents (circulation, voisins) fragmentent le sommeil meme si vous ne vous en rendez pas compte. Le bruit blanc ou les sons de la nature masquent ces perturbations.", "tasks": ["Identifiez les sources de bruit dans votre environnement", "Testez des bouchons d'oreilles ou une machine a bruit blanc", "Essayez un son de pluie ou de vagues pendant 3 nuits"], "tip": "Le bruit blanc a 40-50 dB accelere l'endormissement et reduit les micro-reveils de 38% (etude Messineo, 2017)."},
            "11": {"focus": "Nutrition pro-sommeil", "mission": "Le tryptophane, le magnesium et les vitamines B6 sont les precurseurs de la melatonine et de la serotonine. L'alimentation du soir influence directement la qualite du sommeil.", "tasks": ["Dinez leger, 2-3h avant le coucher", "Integrez un aliment riche en tryptophane (banane, noix, dinde, lait tiede)", "Evitez l'alcool ce soir (l'alcool fragmente le sommeil profond)"], "tip": "L'alcool est un faux ami : il aide a s'endormir mais supprime le sommeil paradoxal et augmente les micro-reveils en 2e partie de nuit."},
            "12": {"focus": "Le magnesium du soir", "mission": "Le magnesium active les recepteurs GABA (neurotransmetteur de la relaxation) et aide a reguler la melatonine. 50% des personnes agees sont en deficit de magnesium.", "tasks": ["Mangez des aliments riches en magnesium (amandes, chocolat noir, epinards)", "Buvez une eau riche en magnesium le soir (Hepar, Contrex)", "Testez un bain de pieds au sel d'Epsom (sulfate de magnesium) avant de dormir"], "tip": "Le magnesium bisglycinate est la forme la mieux absorber. 200-400mg le soir est la dose recommandee par les etudes."},
            "13": {"focus": "Deconnexion mentale", "mission": "Les pensees intrusives au coucher sont la cause n.1 d'insomnie. Le 'journaling' du soir vide le cerveau et reduit le temps d'endormissement de 9 minutes (etude Scullin, 2018).", "tasks": ["Ecrivez toutes vos pensees/preoccupations dans un carnet (5 min)", "Pratiquez le body scan de relaxation progressive (10 min)", "Si une pensee revient, notez-la et dites-vous 'je m'en occupe demain'"], "tip": "Technique du body scan : allonge, contractez puis relachezchaque groupe musculaire des pieds au visage. En 10 minutes, la tension musculaire baisse de 50%."},
            "14": {"focus": "Bilan de la semaine 2", "mission": "Votre environnement est maintenant optimise. Les habitudes alimentaires et la gestion du bruit/lumiere devraient montrer des resultats mesurables.", "tasks": ["Comparez vos donnees de sommeil semaine 1 vs semaine 2", "Notez les 3 changements d'environnement les plus efficaces", "Evaluez : temps d'endormissement, nombre de reveils, sensation au reveil"], "tip": "Si votre bracelet montre plus de sommeil profond et moins d'interruptions, votre environnement fonctionne."},
            "15": {"focus": "Creer VOTRE rituel personnalise", "mission": "Les meilleures habitudes sont celles que vous maintiendrez. Il est temps de combiner ce qui a le mieux fonctionne pour VOUS.", "tasks": ["Listez les 5 techniques des 14 premiers jours qui vous ont le plus aide", "Creez un rituel de 20-30 minutes combinant vos 3 meilleures techniques", "Pratiquez ce rituel personnalise ce soir et chronomettez-le"], "tip": "Un rituel de 20-30 minutes est ideal. Moins de 15 minutes n'est pas suffisant pour deconnecter, plus de 40 minutes peut devenir contraignant."},
            "16": {"focus": "Siestes strategiques", "mission": "La sieste de 20 minutes (power nap) ameliore les performances cognitives de 34% (NASA, etude Rosekind). Mais une sieste trop longue ou trop tardive detruit le sommeil nocturne.", "tasks": ["Si besoin de sieste : maximum 20 minutes, avant 15h", "Utilisez une alarme pour ne pas depasser 20 minutes", "Notez votre energie de l'apres-midi avec vs sans sieste"], "tip": "La somnolence post-dejeuner (14h) est physiologique (creux circadien). C'est le moment ideal pour une micro-sieste."},
            "17": {"focus": "Lumiere matinale et chronobiologie", "mission": "L'exposition a la lumiere matinale (10 000 lux) recale l'horloge circadienne et avance la secretion de melatonine le soir. C'est la theraphie n.1 des troubles du rythme circadien.", "tasks": ["15-30 minutes de lumiere naturelle dans l'heure qui suit le reveil", "Ne portez pas de lunettes de soleil le matin (sauf soleil direct)", "Le soir, baissez progressivement la lumiere a partir de 20h"], "tip": "Meme par temps nuageux, la lumiere exterieure est 10x plus intense que la lumiere interieure. Sortir 15 min le matin est plus efficace qu'une lampe de luminotherapie."},
            "18": {"focus": "Gerer les reveils nocturnes", "mission": "Se reveiller la nuit est normal (2-5 micro-reveils par nuit). Le probleme c'est de ne pas se rendormir. La technique cognitive est plus efficace que les somniferes a long terme.", "tasks": ["Si reveil nocturne : NE regardez PAS l'heure (source d'anxiete)", "Pratiquez la respiration 4-7-8 (inspirez 4s, retenez 7s, expirez 8s)", "Si pas rendormi apres 20 minutes : levez-vous, lisez, puis recouchez-vous"], "tip": "Regarder l'heure la nuit declenche un calcul mental ('il ne me reste que X heures') qui augmente le cortisol et empeche le retour au sommeil."},
            "19": {"focus": "Reguler le week-end", "mission": "Le 'jet-lag social' (se coucher/lever 2h plus tard le week-end) desynchronise l'horloge biologique. Chaque heure de decalage necessite 1 jour de readaptation.", "tasks": ["Gardez la meme heure de coucher ce week-end (+30min max)", "Levez-vous au maximum 1h plus tard que d'habitude", "Maintenez votre rituel du soir sans exception"], "tip": "Les personnes qui gardent des horaires reguliers 7j/7 ont 40% moins de problemes de sommeil (etude Wittmann, 2006)."},
            "20": {"focus": "Preparer l'apres-programme", "mission": "La cle du succes a long terme est l'automatisation. Apres 21 jours, vos habitudes doivent devenir des reflexes, pas des efforts.", "tasks": ["Listez vos 5 habitudes non-negociables pour la suite", "Programmez des rappels permanents pour les 3 plus importantes", "Definissez votre objectif sommeil pour le mois prochain (ex: 7h30 chaque nuit)"], "tip": "Les etudes montrent qu'il faut 66 jours en moyenne pour qu'une habitude devienne automatique (Lally, 2010). Mais apres 21 jours, le plus dur est fait."},
            "21": {"focus": "Bilan final et celebration", "mission": "Vous avez complete 21 jours de transformation de votre sommeil. Il est temps de mesurer les resultats concrets et de celebrer vos progres.", "tasks": ["Comparez vos donnees de sommeil jour 1 vs jour 21 dans l'app", "Evaluez votre qualite de sommeil actuelle sur 5 et comparez avec le jour 1", "Partagez vos resultats avec vos gardiens ou vos amis du programme"], "tip": "Votre cerveau a physiquement change : les circuits neuronaux des bonnes habitudes de sommeil se sont renforces. Continuez et ils deviendront permanents."},
        },
    },
    {
        "id": "prog-tension-14",
        "title": "14 jours pour stabiliser sa tension",
        "subtitle": "Programme scientifique pour votre tension arterielle",
        "icon": "ri-heart-pulse-line",
        "color": "#EF4444",
        "duration_days": 14,
        "category": "cardiovasculaire",
        "difficulty": "moyen",
        "effort": "20-30 min/jour",
        "description": "Programme base sur le regime DASH et les recommandations de la Societe Francaise d'Hypertension. 2 semaines pour comprendre et ameliorer votre tension par l'alimentation, l'activite et la gestion du stress.",
        "benefits": [
            "Reduction de la tension de 5-14 mmHg en 2 semaines (regime DASH)",
            "Apprentissage de la mesure correcte de la tension",
            "Adoption d'habitudes alimentaires cardioprotectrices",
            "Reduction du stress par la coherence cardiaque",
        ],
        "data_used": ["Tension arterielle", "Frequence cardiaque", "Nombre de pas", "Poids", "Niveau de stress"],
        "medical_disclaimer": "Si votre tension est superieure a 180/110 mmHg ou si vous prenez un traitement antihypertenseur, consultez votre medecin avant de modifier vos habitudes.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Reduire ma tension naturellement", "Comprendre ma tension", "Completer mon traitement", "Prevenir l'hypertension"]},
            {"key": "medication", "label": "Prenez-vous un traitement pour la tension ?", "type": "yesno"},
        ],
        "tracked_metrics": ["blood_pressure", "heart_rate", "steps", "weight", "stress_level"],
        "phases": [
            {"name": "Comprendre & Alimentation", "days": [1, 7], "description": "Mesurer, comprendre et ajuster l'alimentation (regime DASH)", "color": "#EF4444"},
            {"name": "Activite & Stress", "days": [8, 14], "description": "Activite physique adaptee et gestion du stress", "color": "#DC2626"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Comprendre votre tension", "mission": "La tension arterielle est la pression du sang dans vos arteres. Au-dessus de 140/90 mmHg, le risque cardiovasculaire augmente significativement.", "tasks": ["Mesurez votre tension matin et soir (assis, au calme, 5 min de repos)", "Notez les valeurs dans l'app", "Apprenez la difference entre systolique (haute) et diastolique (basse)"], "tip": "Mesurez toujours au meme moment, au meme bras, assis depuis 5 min. La tension varie de 20-30 mmHg dans la journee — c'est normal."},
            "2": {"focus": "Reduire le sel", "tasks": ["Pas de sel ajoute aujourd'hui", "Evitez les plats prepares et la charcuterie", "Decouvrez les epices et herbes comme alternative"], "tip": "Le sel est le facteur n.1 de l'hypertension. Reduire de 6g/jour baisse la tension de 5-6 mmHg (OMS)."},
            "3": {"focus": "Augmenter le potassium", "tasks": ["Mangez une banane ou des epinards", "Ajoutez des lentilles a un repas", "Buvez un verre de jus d'orange frais"], "tip": "Le potassium contrebalance l'effet du sodium. Objectif : 3500mg/jour."},
            "4": {"focus": "Hydratation optimale", "tasks": ["Buvez 1.5L d'eau minimum aujourd'hui", "Remplacez un cafe par une tisane", "Notez votre consommation d'eau"], "tip": "La deshydratation augmente la tension. L'eau plate est preferable a l'eau gazeuse salee."},
            "5": {"focus": "Reduire l'alcool", "tasks": ["Pas d'alcool aujourd'hui", "Remplacez par de l'eau gazeuse ou un mocktail", "Observez l'impact sur votre tension du soir"], "tip": "L'alcool augmente la tension de 5-10 mmHg. L'effet dure 12-24h."},
            "6": {"focus": "Alimentation DASH", "tasks": ["5 portions de fruits et legumes aujourd'hui", "Choisissez des cereales completes", "Reduisez les graisses saturees (beurre, fromage gras)"], "tip": "Le regime DASH reduit la tension de 8-14 mmHg — autant qu'un medicament pour certains patients."},
            "7": {"focus": "Bilan semaine 1", "tasks": ["Comparez vos tensions jour 1 vs jour 7", "Notez les changements alimentaires reussis", "Evaluez la difficulte sur 5"], "tip": "L'alimentation agit en 1-2 semaines sur la tension. Les resultats sont souvent visibles des le jour 7."},
            "8": {"focus": "Marche quotidienne", "tasks": ["30 minutes de marche a rythme modere", "Pas d'essoufflement excessif (vous devez pouvoir parler)", "Mesurez votre tension avant et 30min apres la marche"], "tip": "L'exercice regulier baisse la tension de 5-8 mmHg (American Heart Association)."},
            "9": {"focus": "Coherence cardiaque", "tasks": ["5 minutes de coherence cardiaque le matin (inspire 5s, expire 5s)", "5 minutes de respiration profonde le soir", "Notez votre niveau de stress avant/apres"], "tip": "La coherence cardiaque a 6 respirations/min active le nerf vague et reduit la tension de 10mmHg en aigu."},
            "10": {"focus": "Gestion du stress", "tasks": ["Identifiez vos 3 principales sources de stress", "Pratiquez 10 min de relaxation (body scan ou meditation)", "Ecrivez dans un journal de gratitude (3 points positifs)"], "tip": "Le stress chronique maintient un taux de cortisol eleve qui augmente la tension de facon permanente."},
            "11": {"focus": "Sommeil et tension", "tasks": ["Couchez-vous avant 23h", "Pas d'ecran 1h avant le coucher", "Mesurez votre tension au reveil"], "tip": "Un mauvais sommeil augmente la tension de 10%. L'apnee du sommeil est une cause frequente d'hypertension resistante."},
            "12": {"focus": "Activite douce", "tasks": ["20 min de yoga ou tai-chi", "10 min d'etirements le matin", "Marche de 15 min apres le dejeuner"], "tip": "Les activites douces baissent le cortisol et la tension sans effort intense."},
            "13": {"focus": "Poids et tension", "tasks": ["Pesez-vous aujourd'hui", "Notez votre IMC dans l'app", "Fixez un objectif realiste si necessaire"], "tip": "Perdre 5kg peut baisser la tension de 5 mmHg. C'est un levier majeur."},
            "14": {"focus": "Bilan final", "tasks": ["Comparez toutes vos tensions jour 1 vs jour 14 dans l'app", "Listez vos 5 meilleures habitudes adoptees", "Planifiez comment les maintenir au quotidien"], "tip": "Vous avez les cles pour controler votre tension. La constance est le secret."},
        },
    },
    {
        "id": "prog-activity-30",
        "title": "30 jours pour bouger plus",
        "subtitle": "Programme progressif d'activite physique adaptee",
        "icon": "ri-footprint-line",
        "color": "#10B981",
        "duration_days": 30,
        "category": "activite",
        "difficulty": "progressif",
        "effort": "15-40 min/jour",
        "description": "Programme base sur les recommandations de l'OMS pour les seniors. 30 jours pour integrer l'activite physique a votre quotidien de facon progressive, sure et agreable. Pas de performance, juste du mouvement adapte a votre condition.",
        "benefits": [
            "Augmentation de la force musculaire (+20-30% en 30 jours)",
            "Amelioration de l'equilibre et prevention des chutes",
            "Reduction du risque cardiovasculaire",
            "Boost de l'humeur et reduction de l'anxiete",
            "Meilleure qualite de sommeil",
        ],
        "data_used": ["Nombre de pas", "Calories brulees", "Frequence cardiaque", "Score de recuperation", "Qualite du sommeil"],
        "medical_disclaimer": "Consultez votre medecin avant de commencer si vous avez des problemes cardiaques, articulaires ou si vous n'avez pas fait d'exercice depuis longtemps.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Reprendre une activite douce", "Ameliorer mon equilibre", "Perdre du poids", "Avoir plus d'energie", "Prevenir les chutes"]},
            {"key": "current_activity", "label": "Votre niveau d'activite actuel", "type": "choice", "options": ["Sedentaire (moins de 2000 pas/jour)", "Peu actif (2000-5000 pas/jour)", "Moderement actif (5000-8000 pas/jour)"]},
        ],
        "tracked_metrics": ["steps", "calories", "heart_rate", "recovery_score", "sleep_quality"],
        "phases": [
            {"name": "Decouverte", "days": [1, 10], "description": "Reprendre doucement avec la marche et les etirements", "color": "#10B981"},
            {"name": "Progression", "days": [11, 20], "description": "Augmenter duree et varier les activites", "color": "#059669"},
            {"name": "Autonomie", "days": [21, 30], "description": "Creer votre routine personnelle durable", "color": "#047857"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Premier pas", "tasks": ["15 minutes de marche tranquille", "Choisissez un parcours agreable pres de chez vous", "Notez comment vous vous sentez apres"], "tip": "L'OMS recommande 150 min d'activite moderee par semaine. On y va progressivement."},
            "2": {"focus": "Decouvrir son rythme", "tasks": ["20 minutes de marche", "Trouvez votre rythme confortable (pouvoir parler)", "Respirez par le nez autant que possible"], "tip": "Le rythme ideal : vous pouvez parler mais pas chanter."},
            "3": {"focus": "Explorer son quartier", "tasks": ["25 minutes de marche", "Decouvrez un nouveau chemin ou parcours", "Observez la nature autour de vous"], "tip": "Varier les parcours maintient la motivation et stimule le cerveau."},
            "4": {"focus": "Etirements matinaux", "tasks": ["10 min d'etirements au reveil (cou, epaules, dos, jambes)", "15 min de marche", "Notez votre souplesse sur 5"], "tip": "S'etirer le matin reduit les raideurs et previent les blessures."},
            "5": {"focus": "Marche et respiration", "tasks": ["25 min de marche consciente", "Concentrez-vous sur vos sensations a chaque pas", "3 pauses de respiration profonde pendant la marche"], "tip": "La marche consciente reduit le cortisol de 40% (etude Stanford, 2020)."},
            "6": {"focus": "Escaliers et denivelé", "tasks": ["Prenez les escaliers aujourd'hui (au moins 2 etages)", "20 min de marche avec un leger denivele", "Notez vos sensations (souffle, jambes)"], "tip": "Les escaliers renforcent le coeur et les quadriceps — muscles cles anti-chute."},
            "7": {"focus": "Repos actif", "tasks": ["Etirements doux (15 min)", "Pas de marche obligatoire aujourd'hui", "Hydratez-vous bien (1.5L minimum)"], "tip": "Le repos fait partie de l'entrainement. Vos muscles se renforcent au repos."},
            "8": {"focus": "30 minutes de marche", "tasks": ["30 minutes de marche a rythme regulier", "Ecoutez de la musique ou un podcast", "Felicitez-vous : 30min c'est le seuil OMS !"], "tip": "30 minutes d'activite moderee 5 fois/semaine reduit le risque cardiovasculaire de 30%."},
            "9": {"focus": "Marche sociale", "tasks": ["Invitez quelqu'un a marcher avec vous", "30 min de marche a deux", "Partagez vos progres de la semaine"], "tip": "L'activite sociale motive et rend l'effort 2x plus agreable."},
            "10": {"focus": "Bilan phase 1", "tasks": ["Comparez vos pas jour 1 vs aujourd'hui", "Celebrez 10 jours de mouvement !", "Fixez un objectif pour la phase 2"], "tip": "Apres 10 jours, votre endurance a deja augmente. Votre coeur est plus efficace."},
            "11": {"focus": "Varier les mouvements", "tasks": ["20 min de marche + 10 min de gymnastique douce", "Essayez des mouvements de bras pendant la marche", "Notez les exercices que vous preferez"], "tip": "La variete travaille differents groupes musculaires et evite la monotonie."},
            "12": {"focus": "Equilibre et coordination", "tasks": ["Tenez sur un pied 30 secondes (avec appui si besoin)", "Marche talon-pointe sur 10 metres", "25 min de marche"], "tip": "L'equilibre est le facteur n.1 de prevention des chutes chez les seniors."},
            "13": {"focus": "Renforcement doux", "tasks": ["10 lever de chaise (squats avec chaise)", "10 montees sur pointes de pieds", "25 min de marche"], "tip": "Le renforcement musculaire preserve la masse musculaire — essentiel apres 60 ans."},
            "14": {"focus": "Marche rapide par intervalles", "tasks": ["30 min de marche : alternez 3 min normal / 2 min rapide", "Notez votre frequence cardiaque apres les phases rapides", "Etirez-vous apres"], "tip": "L'entrainement par intervalles est 40% plus efficace que la marche continue (meta-analyse 2021)."},
            "15": {"focus": "Souplesse", "tasks": ["15 min d'etirements complets", "Essayez 10 min de yoga doux (postures simples)", "20 min de marche"], "tip": "La souplesse ameliore la mobilite quotidienne et reduit les douleurs articulaires."},
            "16": {"focus": "Musique et mouvement", "tasks": ["Creez une playlist motivante", "30 min de marche en musique", "Calez votre rythme sur le tempo"], "tip": "La musique augmente l'endurance de 15% et rend l'effort plus agreable."},
            "17": {"focus": "Haut du corps", "tasks": ["10 pompes contre le mur", "10 flexions avec bouteilles d'eau (500ml)", "25 min de marche"], "tip": "Le haut du corps est souvent neglige mais essentiel pour l'autonomie quotidienne."},
            "18": {"focus": "Marche longue", "tasks": ["40 min de marche a votre rythme", "Explorez un parc ou un sentier nature", "Emportez de l'eau et un en-cas"], "tip": "Les marches longues a intensite moderee brulent plus de graisses que les efforts courts et intenses."},
            "19": {"focus": "Respiration et effort", "tasks": ["5 min de coherence cardiaque avant l'effort", "30 min de marche", "10 min d'etirements apres"], "tip": "Bien respirer pendant l'effort optimise chaque mouvement et previent les crampes."},
            "20": {"focus": "Bilan phase 2", "tasks": ["Comparez vos capacites phase 1 vs phase 2", "Notez vos exercices preferes", "Vous etes a 2/3 du programme !"], "tip": "En 20 jours, votre endurance, force et equilibre se sont significativement ameliores."},
            "21": {"focus": "Creer votre routine", "tasks": ["Choisissez vos 3 exercices preferes", "Planifiez votre semaine d'activite", "30 min de marche + vos exercices choisis"], "tip": "La meilleure routine est celle que vous maintiendrez avec plaisir."},
            "22": {"focus": "Depasser ses limites", "tasks": ["Ajoutez 5 min a votre marche habituelle", "Essayez un nouvel exercice", "Notez votre ressenti"], "tip": "Sortir de sa zone de confort, meme legerement, fait progresser."},
            "23": {"focus": "Nature et mouvement", "tasks": ["Marche en foret ou dans un parc (35 min)", "Observez la nature en marchant", "Respirez profondement l'air frais"], "tip": "La nature reduit le cortisol de 20% et augmente les cellules immunitaires NK (etude Li, 2010)."},
            "24": {"focus": "Circuit maison", "tasks": ["Circuit : 10 squats + 10 montees genoux + 10 talons-fesses", "Repetez 3 fois avec 1 min de pause", "20 min de marche"], "tip": "Un circuit de 15 min a la meme efficacite cardiovasculaire que 30 min de marche."},
            "25": {"focus": "Marche meditative", "tasks": ["30 min de marche lente et consciente", "Concentrez-vous sur chaque pas", "Pas de musique — juste le silence et vos sensations"], "tip": "La marche meditative calme le mental et ameliore la proprioception (conscience du corps)."},
            "26": {"focus": "Journee active", "tasks": ["Prenez les escaliers toute la journee", "Marchez 10 min apres chaque repas", "Faites une course a pied plutot qu'en voiture"], "tip": "L'activite fractionnee est aussi efficace que l'activite continue (etude 2022)."},
            "27": {"focus": "Sport doux", "tasks": ["Essayez le yoga, la natation ou le velo (30 min)", "Notez ce que vous avez prefere", "Comparez avec la marche"], "tip": "Varier les activites travaille differents muscles et previent l'ennui."},
            "28": {"focus": "Record personnel", "tasks": ["40 min de marche a bon rythme", "Essayez de battre votre record de pas", "Celebrez votre progression !"], "tip": "Comparez avec le jour 1 — la difference est considerable."},
            "29": {"focus": "Planifier l'apres-programme", "tasks": ["Ecrivez votre routine hebdomadaire ideale", "Fixez 3 objectifs pour le mois prochain", "Identifiez les obstacles potentiels et vos solutions"], "tip": "La planification est la cle de la constance a long terme."},
            "30": {"focus": "Celebration finale !", "tasks": ["Comparez vos donnees jour 1 vs jour 30 dans l'app", "Partagez vos resultats avec vos proches", "Felicitez-vous : 30 jours de mouvement regulier !"], "tip": "Vous avez prouve que vous pouvez. L'habitude est installee — ne vous arretez plus."},
        },
    },
    {
        "id": "prog-nutrition-21",
        "title": "21 jours pour mieux manger",
        "subtitle": "Nutrition anti-inflammatoire et hydratation optimale",
        "icon": "ri-restaurant-line",
        "color": "#F97316",
        "duration_days": 21,
        "category": "nutrition",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur le regime mediterraneen et les recherches en nutrigerontologie. 3 semaines pour adopter une alimentation anti-inflammatoire, optimiser votre hydratation et renforcer votre microbiote. Chaque jour cible un nutriment ou une habitude alimentaire scientifiquement prouvee pour la longevite.",
        "benefits": [
            "Reduction de l'inflammation chronique (-30% CRP selon etudes regime mediterraneen)",
            "Amelioration de l'hydratation cellulaire et de la fonction renale",
            "Renforcement du microbiote intestinal (immunite, humeur, digestion)",
            "Prevention de la sarcopenie par un apport proteique adapte",
            "Reduction du risque de maladies neurodegeneratives (etude MIND Diet, 2015)",
        ],
        "data_used": ["Poids", "IMC", "Hydratation", "Masse musculaire", "Graisse viscerale", "Age corporel"],
        "medical_disclaimer": "Ce programme ne remplace pas un suivi dietetique personnalise. Si vous avez un diabete, une insuffisance renale ou des allergies alimentaires, consultez votre medecin avant de modifier votre alimentation.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif principal", "type": "choice", "options": ["Manger plus equilibre", "Perdre du poids", "Avoir plus d'energie", "Ameliorer ma digestion", "Prevenir les maladies"]},
            {"key": "restrictions", "label": "Avez-vous des restrictions alimentaires ?", "type": "choice", "options": ["Aucune", "Sans gluten", "Sans lactose", "Vegetarien", "Diabete"]},
            {"key": "water_daily", "label": "Combien d'eau buvez-vous par jour ?", "type": "choice", "options": ["Moins de 0.5L", "0.5 a 1L", "1 a 1.5L", "Plus de 1.5L"]},
            {"key": "diet_quality", "label": "Comment evaluez-vous votre alimentation actuelle ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["weight", "bmi", "water_pct", "muscle_pct", "visceral_fat", "body_age"],
        "phases": [
            {"name": "Hydratation & Bases", "days": [1, 7], "description": "Optimiser l'hydratation et poser les fondamentaux nutritionnels", "color": "#F97316"},
            {"name": "Anti-inflammatoire", "days": [8, 14], "description": "Adopter l'alimentation mediterraneenne anti-inflammatoire", "color": "#EA580C"},
            {"name": "Microbiote & Longevite", "days": [15, 21], "description": "Renforcer le microbiote et ancrer les habitudes de longevite", "color": "#C2410C"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre hydratation", "mission": "La deshydratation chronique touche 40% des personnes agees (etude Hooper, 2014). Elle augmente le risque d'infections urinaires, de confusion et de chutes. Un adulte a besoin de 1.5 a 2L d'eau par jour.", "tasks": ["Buvez 8 verres d'eau aujourd'hui (1.5L minimum)", "Notez chaque verre bu dans la journee", "Verifiez la couleur de vos urines (clair = bien hydrate)"], "tip": "La sensation de soif diminue avec l'age. N'attendez pas d'avoir soif pour boire — programmez des rappels."},
            "2": {"focus": "Les fruits et legumes", "mission": "L'OMS recommande 5 portions de fruits et legumes par jour. Chaque portion supplementaire reduit le risque cardiovasculaire de 4% (meta-analyse Aune, 2017). Les antioxydants qu'ils contiennent combattent le stress oxydatif.", "tasks": ["Mangez au moins 5 portions de fruits et legumes aujourd'hui", "Variez les couleurs (chaque couleur = differents antioxydants)", "Integrez un legume vert a chaque repas"], "tip": "Rouge (tomate/poivron) = lycopene. Orange (carotte) = beta-carotene. Vert (epinard) = luteine. Violet (myrtille) = anthocyanes."},
            "3": {"focus": "Reduire le sucre ajoute", "mission": "Le sucre ajoute provoque une inflammation chronique et accelere le vieillissement cellulaire via la glycation des proteines (etude Semba, 2010). L'OMS recommande moins de 25g de sucre ajoute par jour.", "tasks": ["Pas de boisson sucree aujourd'hui", "Lisez les etiquettes de 3 produits de votre placard", "Remplacez un dessert sucre par un fruit frais"], "tip": "Le sucre se cache partout : pain de mie (3g/tranche), yaourt aromatise (12g), jus de fruit (25g/verre). Lisez les etiquettes."},
            "4": {"focus": "Les proteines pour les muscles", "mission": "Apres 60 ans, la masse musculaire diminue de 1-2% par an (sarcopenie). Un apport proteique de 1.2g/kg/jour (vs 0.8g standard) preserve la masse musculaire et l'autonomie (etude Bauer, 2013).", "tasks": ["Integrez une source de proteine a chaque repas", "Mangez des oeufs, du poisson, des legumineuses ou de la viande blanche", "Calculez votre besoin : votre poids x 1.2 = grammes de proteines/jour"], "tip": "20g de proteines = 100g de poulet, 2 oeufs, 150g de lentilles, 200g de yaourt grec. Repartissez sur 3 repas."},
            "5": {"focus": "Les bonnes graisses", "mission": "Les acides gras omega-3 (poisson, noix, lin) reduisent l'inflammation de 30% et protegent le cerveau (etude PREDIMED, 2018). A l'inverse, les graisses trans et saturees augmentent le risque cardiovasculaire.", "tasks": ["Mangez du poisson gras aujourd'hui (saumon, sardine, maquereau)", "Utilisez de l'huile d'olive pour cuisiner", "Ajoutez une poignee de noix ou amandes a votre collation"], "tip": "2 portions de poisson gras par semaine couvrent vos besoins en omega-3. L'huile d'olive extra-vierge contient des polyphenols anti-inflammatoires."},
            "6": {"focus": "Reduire le sel", "mission": "L'exces de sel augmente la tension arterielle et le risque d'AVC. Les Francais consomment en moyenne 10g/jour, le double de la recommandation OMS (5g/jour). Reduire de 3g/jour baisse la tension de 4-5 mmHg.", "tasks": ["Pas de sel ajoute a table aujourd'hui", "Remplacez le sel par des epices et herbes aromatiques", "Evitez les plats prepares industriels (souvent >2g de sel par portion)"], "tip": "Curcuma, poivre, ail, citron, herbes de Provence : des exhausteurs de gout naturels sans sodium."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, votre hydratation devrait deja s'etre amelioree. Les premiers effets de l'alimentation sur l'inflammation se mesurent en 2-4 semaines.", "tasks": ["Comparez votre hydratation jour 1 vs aujourd'hui", "Notez les 3 changements alimentaires les plus faciles a maintenir", "Pesez-vous et notez dans l'app"], "tip": "Si votre balance connectee montre une amelioration du taux d'hydratation, c'est un signe objectif de progres."},
            "8": {"focus": "Le regime mediterraneen", "mission": "Le regime mediterraneen est le plus etudie au monde pour la longevite. Il reduit le risque cardiovasculaire de 30%, le risque de diabete de 52% et le risque de depression de 33% (etude PREDIMED, 2013).", "tasks": ["Preparez un repas 100% mediterraneen (legumes, huile d'olive, poisson ou legumineuses)", "Ajoutez des herbes aromatiques fraiches", "Privilegiez les cereales completes (pain complet, riz brun)"], "tip": "Assiette mediterraneenne ideale : 50% legumes, 25% proteines (poisson/legumineuses), 25% cereales completes, huile d'olive."},
            "9": {"focus": "Les fibres pour le microbiote", "mission": "Les fibres alimentaires nourrissent les bonnes bacteries intestinales. Un microbiote sain renforce l'immunite, reduit l'inflammation et ameliore l'humeur via l'axe intestin-cerveau (etude Sonnenburg, 2016).", "tasks": ["Mangez 30g de fibres aujourd'hui (legumes, fruits, cereales completes, legumineuses)", "Ajoutez des legumineuses a un repas (lentilles, pois chiches, haricots)", "Mangez un fruit avec sa peau (bio de preference)"], "tip": "Les legumineuses sont les champions des fibres : 15g pour 200g de lentilles. Introduisez-les progressivement si vous n'en mangez pas d'habitude."},
            "10": {"focus": "Les aliments fermentes", "mission": "Les aliments fermentes (yaourt, kefir, choucroute, miso) apportent des probiotiques vivants qui renforcent le microbiote. Une meta-analyse de 2019 (Selhub) montre qu'ils reduisent l'inflammation intestinale de 20%.", "tasks": ["Mangez un aliment fermente aujourd'hui (yaourt nature, kefir, fromage affine)", "Essayez la choucroute ou le kimchi en accompagnement", "Evitez les yaourts sucres (preferez nature + miel)"], "tip": "Le yaourt nature contient 10 milliards de bacteries benefiques par pot. Choisissez-le sans sucre ajoute."},
            "11": {"focus": "L'assiette anti-inflammatoire", "mission": "L'inflammation chronique de bas grade accelere le vieillissement (inflammaging). Les aliments anti-inflammatoires (curcuma, gingembre, baies, legumes verts) contrent ce processus (etude Calder, 2017).", "tasks": ["Integrez du curcuma + poivre noir a un plat (le poivre augmente l'absorption x2000)", "Mangez des baies (myrtilles, framboises) au petit-dejeuner", "Buvez un the vert dans l'apres-midi (catechines anti-inflammatoires)"], "tip": "Le curcuma seul est mal absorbe. Ajoutez toujours du poivre noir et un corps gras (huile d'olive) pour multiplier son efficacite."},
            "12": {"focus": "Calcium et vitamine D", "mission": "Apres 65 ans, le risque d'osteoporose augmente fortement. Le calcium (1200mg/jour) et la vitamine D (800 UI/jour) sont essentiels pour la densite osseuse (recommandations HAS 2024).", "tasks": ["Mangez 3 produits laitiers aujourd'hui ou des equivalents vegetaux enrichis", "Sortez 15 minutes au soleil (bras decouverts) pour la vitamine D", "Mangez des sardines en conserve (avec les aretes = calcium)"], "tip": "15 min de soleil par jour produisent 80% de vos besoins en vitamine D. En hiver, une supplementation peut etre necessaire."},
            "13": {"focus": "Manger en pleine conscience", "mission": "Manger lentement (20-30 minutes par repas) ameliore la digestion, la satiete et l'absorption des nutriments. Une etude de 2018 (Hurst) montre que manger vite augmente le risque d'obesite de 115%.", "tasks": ["Prenez au moins 20 minutes pour votre dejeuner", "Posez vos couverts entre chaque bouchee", "Mangez sans ecran (TV, telephone)"], "tip": "La satiete met 20 minutes a arriver au cerveau. Manger lentement evite naturellement de trop manger."},
            "14": {"focus": "Bilan semaine 2", "mission": "Apres 14 jours d'alimentation amelioree, les marqueurs d'inflammation commencent a baisser. Votre microbiote est en cours de transformation.", "tasks": ["Comparez votre poids et composition corporelle jour 1 vs jour 14", "Notez les 3 recettes ou aliments decouverts que vous gardez", "Evaluez votre energie et votre digestion sur 5"], "tip": "Les changements de microbiote sont mesurables en 2 semaines. Continuez pour ancrer les resultats."},
            "15": {"focus": "Les super-aliments de la longevite", "mission": "Les zones bleues (regions du monde ou l'on vit le plus longtemps) partagent des aliments communs : legumineuses, legumes verts, noix, cereales completes, the vert (etude Buettner, 2012).", "tasks": ["Integrez au moins 3 aliments des zones bleues dans vos repas aujourd'hui", "Mangez une poignee de noix en collation", "Preparez une soupe de legumineuses pour le diner"], "tip": "A Okinawa (Japon), on mange du tofu, des patates douces et du the vert. En Sardaigne, des haricots, du pain complet et du vin rouge (modere)."},
            "16": {"focus": "L'hydratation avancee", "mission": "Au-dela de l'eau, les bouillons, soupes et infusions comptent dans l'hydratation. Les aliments riches en eau (concombre 96%, tomate 94%, pasteque 92%) completent l'apport hydrique.", "tasks": ["Buvez 2L de liquides aujourd'hui (eau + infusions + soupes)", "Mangez un aliment riche en eau a chaque repas", "Preparez une infusion sans cafeine pour le soir"], "tip": "Une soupe de legumes apporte 300-400ml d'eau + vitamines + mineraux. C'est l'aliment hydratant ideal pour le soir."},
            "17": {"focus": "Le petit-dejeuner ideal", "mission": "Le petit-dejeuner represente 25-30% des apports nutritionnels. Un petit-dejeuner riche en proteines et fibres stabilise la glycemie toute la matinee et reduit les fringales (etude Leidy, 2015).", "tasks": ["Petit-dejeuner complet : proteines + fibres + bon gras + fruit", "Essayez : yaourt grec + muesli complet + fruits + noix", "Evitez les cereales industrielles et viennoiseries"], "tip": "Exemple ideal : 1 oeuf + pain complet + avocat + fruit. Ou : yaourt grec + flocons d'avoine + myrtilles + amandes."},
            "18": {"focus": "Cuisiner maison", "mission": "Les plats ultra-transformes representent 30% des calories en France et augmentent le risque de mortalite de 14% (etude NutriNet-Sante, 2019). Cuisiner maison divise par 3 la consommation de sel et de sucre.", "tasks": ["Preparez tous vos repas maison aujourd'hui", "Cuisinez en batch : preparez une grande quantite pour 2-3 jours", "Remplacez un produit industriel par son equivalent fait maison"], "tip": "Cuisiner 2h le dimanche peut couvrir 3-4 repas de la semaine. Le batch cooking est la cle de la constance."},
            "19": {"focus": "Le gouter sain", "mission": "Une collation de 16h bien choisie previent l'hypoglycemie et evite les grignotages du soir. Les noix, fruits et yaourts sont les meilleures options (etude O'Neil, 2012).", "tasks": ["Gouter a 16h : 1 fruit + 1 poignee de noix ou 1 yaourt nature", "Pas de biscuits, bonbons ou barres chocolatees", "Notez votre faim avant le diner (devrait etre moderee)"], "tip": "Une poignee de noix (30g) apporte des omega-3, du magnesium et des proteines. C'est le snack anti-age par excellence."},
            "20": {"focus": "Preparer l'apres-programme", "mission": "Les habitudes alimentaires mettent 66 jours a devenir automatiques (Lally, 2010). Apres 21 jours, les fondations sont posees. La cle est de continuer.", "tasks": ["Listez vos 5 changements alimentaires non-negociables", "Planifiez vos menus pour la semaine prochaine", "Faites une liste de courses basee sur le regime mediterraneen"], "tip": "La planification des repas reduit le gaspillage alimentaire de 30% et les achats impulsifs de 50%."},
            "21": {"focus": "Bilan final — Nutrition", "mission": "Vous avez transforme votre alimentation en 21 jours. Comparez vos donnees de composition corporelle pour mesurer les resultats concrets.", "tasks": ["Comparez poids, hydratation et masse grasse jour 1 vs jour 21", "Evaluez votre energie, digestion et sommeil sur 5", "Celebrez vos progres et partagez avec vos proches"], "tip": "Meme de petites ameliorations (1-2% d'hydratation, -1kg de graisse) sont significatives pour la sante a long terme."},
        },
    },
    {
        "id": "prog-balance-21",
        "title": "21 jours pour prevenir les chutes",
        "subtitle": "Equilibre, proprioception et renforcement adapte",
        "icon": "ri-walk-line",
        "color": "#06B6D4",
        "duration_days": 21,
        "category": "equilibre",
        "difficulty": "progressif",
        "effort": "15-25 min/jour",
        "description": "Programme base sur les recommandations de l'HAS et les etudes en geriatrie. Les chutes sont la premiere cause d'accident chez les +65 ans. Ce programme travaille l'equilibre, la proprioception, le renforcement des membres inferieurs et les reflexes posturaux en 3 phases progressives.",
        "benefits": [
            "Reduction du risque de chute de 30-40% (meta-analyse Sherrington, 2019)",
            "Amelioration de l'equilibre statique et dynamique",
            "Renforcement des quadriceps et mollets (muscles anti-chute)",
            "Amelioration de la proprioception et des reflexes posturaux",
            "Augmentation de la confiance en soi dans les deplacements",
        ],
        "data_used": ["Nombre de pas", "Score de recuperation", "Frequence cardiaque", "Qualite du sommeil", "Poids"],
        "medical_disclaimer": "Si vous avez des vertiges frequents, des problemes d'oreille interne ou des douleurs articulaires importantes, consultez votre medecin avant de commencer. Faites tous les exercices pres d'un appui stable (chaise, mur).",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Ameliorer mon equilibre", "Prevenir les chutes", "Me sentir plus stable", "Reprendre confiance", "Renforcer mes jambes"]},
            {"key": "fall_history", "label": "Avez-vous fait une chute dans les 12 derniers mois ?", "type": "yesno"},
            {"key": "stability", "label": "Comment evaluez-vous votre stabilite actuelle ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["steps", "recovery_score", "heart_rate", "sleep_quality", "weight"],
        "phases": [
            {"name": "Fondations", "days": [1, 7], "description": "Exercices statiques d'equilibre et proprioception de base", "color": "#06B6D4"},
            {"name": "Renforcement", "days": [8, 14], "description": "Exercices dynamiques et renforcement des membres inferieurs", "color": "#0891B2"},
            {"name": "Integration", "days": [15, 21], "description": "Exercices fonctionnels et situations de la vie quotidienne", "color": "#0E7490"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre equilibre", "mission": "Le test de Romberg (tenir debout pieds joints, yeux fermes, 30s) est utilise par les geriatres pour evaluer l'equilibre. La proprioception (conscience de la position du corps) diminue avec l'age mais se reentrainer.", "tasks": ["Test : tenez debout pieds joints, yeux ouverts, 30 secondes (pres d'un appui)", "Puis yeux fermes, 15 secondes (avec appui a portee)", "Notez votre stabilite sur 5 et votre temps de maintien"], "tip": "Faites toujours les exercices d'equilibre pres d'une chaise ou d'un mur. La securite est la priorite absolue."},
            "2": {"focus": "Appui unipodal", "mission": "Tenir sur un pied est le meilleur predicteur du risque de chute (etude Vellas, 1997). Moins de 5 secondes = risque eleve. L'objectif est d'atteindre 30 secondes de chaque cote.", "tasks": ["Tenez sur le pied droit 15 secondes (avec appui si besoin), repetez 3 fois", "Meme chose sur le pied gauche", "Notez votre temps de maintien de chaque cote"], "tip": "Fixez un point devant vous a hauteur des yeux — cela stabilise enormement l'equilibre. C'est la technique des danseurs."},
            "3": {"focus": "Marche talon-pointe", "mission": "La marche talon-pointe (tandem walk) teste l'equilibre dynamique et la coordination. Elle active le cervelet et les voies vestibulaires, essentiels pour la stabilite en mouvement.", "tasks": ["Marchez 10 pas talon-pointe le long d'une ligne (pres d'un mur)", "Repetez 5 fois dans chaque sens", "Puis marchez normalement 10 minutes pour echauffer"], "tip": "Cette marche est utilisee par la police americaine pour tester l'equilibre. Si c'est difficile, commencez avec un appui sur le mur."},
            "4": {"focus": "Renforcement des chevilles", "mission": "Les chevilles sont la premiere ligne de defense contre les chutes. Les exercices de mobilite et renforcement des chevilles reduisent le risque de entorse de 50% (etude Hupperets, 2009).", "tasks": ["Montees sur pointes de pieds : 3 series de 10 (avec appui chaise)", "Cercles de chevilles : 10 dans chaque sens, chaque pied", "Marche sur les talons : 10 pas aller-retour"], "tip": "Les montees sur pointes renforcent les mollets — muscles essentiels pour se rattraper en cas de desequilibre."},
            "5": {"focus": "Exercices assis-debout", "mission": "Se lever d'une chaise sans les mains est un indicateur cle d'autonomie et de force musculaire. Le test 'Sit-to-Stand' en 30 secondes est utilise en geriatrie pour evaluer la force des jambes.", "tasks": ["Levez-vous d'une chaise et rasseyez-vous 10 fois SANS les mains", "Repetez 3 series avec 1 minute de pause", "Notez combien vous arrivez a en faire en 30 secondes"], "tip": "Moins de 8 en 30 secondes = faiblesse musculaire a travailler. L'objectif est d'atteindre 12-15 repetitions."},
            "6": {"focus": "Proprioception sur surface instable", "mission": "La proprioception (capteurs dans les pieds et articulations) diminue de 30% apres 65 ans. Travailler sur surface instable (coussin, serviette pliee) reentrainer ces capteurs (etude Aman, 2015).", "tasks": ["Tenez debout sur une serviette pliee (surface molle), 30 secondes", "Puis un pied sur la serviette, 15 secondes de chaque cote", "Marche pieds nus sur different sols (moquette, carrelage, herbe)"], "tip": "Marcher pieds nus a la maison stimule les recepteurs plantaires et ameliore la proprioception naturellement."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, votre equilibre statique devrait montrer des ameliorations mesurables. Les adaptations neurales (coordination cerveau-muscles) sont les premieres a apparaitre.", "tasks": ["Refaites le test de Romberg du jour 1 — comparez", "Refaites l'appui unipodal — comparez vos temps", "Notez votre confiance dans vos deplacements sur 5"], "tip": "Les progres en equilibre sont rapides les 2 premieres semaines car le cerveau reapprend a utiliser les informations sensorielles."},
            "8": {"focus": "Pas lateraux et croisement", "mission": "Les chutes laterales sont les plus dangereuses (risque de fracture du col du femur). Les pas lateraux et croises renforcent les muscles abducteurs de la hanche, essentiels pour la stabilite laterale.", "tasks": ["10 pas lateraux vers la droite puis vers la gauche (3 series)", "10 pas croises (le pied passe devant puis derriere l'autre)", "Tenez 20 secondes sur un pied apres l'exercice"], "tip": "Les muscles abducteurs de la hanche sont les plus importants pour empecher les chutes laterales."},
            "9": {"focus": "Montees de genoux", "mission": "La marche avec montee de genoux renforce le psoas-iliaque, muscle profond essentiel pour lever les pieds et eviter les trebuchements — premiere cause de chute (etude Berg, 1989).", "tasks": ["Marche avec montee de genoux sur place : 3 x 20 secondes", "Montee de marche (une seule marche) : 10 fois chaque jambe", "15 minutes de marche a l'exterieur en levant bien les pieds"], "tip": "Le trebuchement se produit quand le pied ne se leve pas assez. Pensez consciemment a lever les pieds quand vous marchez."},
            "10": {"focus": "Exercices avec chaise", "mission": "Les exercices avec chaise (squats assistes, fentes legeres) sont les plus surs et les plus efficaces pour renforcer les jambes chez les seniors (recommandations ACSM, 2018).", "tasks": ["Squats avec chaise : 3 x 10 (touchez la chaise sans vous asseoir)", "Fente avant legere : 5 de chaque cote (avec appui chaise)", "Extension de jambe assise : 3 x 10 chaque jambe"], "tip": "Le squat est le roi des exercices fonctionnels — on fait un squat chaque fois qu'on se leve d'une chaise ou des toilettes."},
            "11": {"focus": "Transferts de poids", "mission": "Le transfert de poids d'un pied a l'autre active les reflexes posturaux anticipatoires (APAs) qui preparent le corps avant un mouvement. Ces reflexes ralentissent avec l'age mais se reentrainent.", "tasks": ["Debout, balancez le poids gauche-droite lentement, 30 secondes", "Puis avant-arriere, 30 secondes", "Marchez en exagerant le transfert de poids, 2 minutes"], "tip": "Ces exercices de balancement sont utilises en reeducation post-chute dans tous les services de geriatrie."},
            "12": {"focus": "Exercices vestibulaires", "mission": "Le systeme vestibulaire (oreille interne) gere l'equilibre en mouvement. Les exercices de rotation de tete pendant la marche ameliorent l'adaptation vestibulaire (protocole Cawthorne-Cooksey).", "tasks": ["Marche en tournant lentement la tete gauche-droite : 1 minute", "Marche en regardant en haut puis en bas : 1 minute", "10 minutes de marche normale ensuite"], "tip": "Si vous avez des vertiges pendant ces exercices, ralentissez. De legers vertiges sont normaux — ils signifient que le systeme vestibulaire travaille."},
            "13": {"focus": "Circuit d'equilibre", "mission": "Combiner equilibre statique, dynamique et renforcement dans un circuit est plus efficace que des exercices isoles (meta-analyse Lesinski, 2015). La variete stimule differents systemes de l'equilibre.", "tasks": ["Circuit : 30s appui unipodal + 10 montees pointes + 10 pas talon-pointe + 10 squats chaise", "Repetez le circuit 3 fois avec 1 min de pause", "Chronometrez le circuit complet"], "tip": "Ce type de circuit est utilise dans les programmes de prevention des chutes recommandes par l'HAS."},
            "14": {"focus": "Bilan semaine 2", "mission": "Apres 14 jours, vos muscles et vos reflexes se sont significativement ameliores. Les quadriceps devraient etre plus forts et l'equilibre dynamique meilleur.", "tasks": ["Refaites le test appui unipodal — objectif : +10 secondes vs jour 1", "Faites le test assis-debout 30 secondes — comparez", "Evaluez votre confiance dans les escaliers et sur terrain irregulier"], "tip": "Si vous pouvez maintenant tenir 20 secondes sur un pied sans appui, c'est un excellent progres."},
            "15": {"focus": "Marche en terrain varie", "mission": "Les chutes arrivent souvent sur terrain irregulier (trottoir, gravier, herbe). S'entrainer a marcher sur differentes surfaces reduit le risque de 25% (etude Okubo, 2020).", "tasks": ["Marchez 15 minutes sur terrain varie (trottoir, herbe, gravier) avec chaussures stables", "Montez et descendez un trottoir 10 fois", "Pratiquez le demi-tour rapide (180 degres) 10 fois"], "tip": "Portez des chaussures a semelle stable et antiderapante. Les pantoufles et chaussettes augmentent le risque de chute a la maison."},
            "16": {"focus": "Se relever du sol", "mission": "Savoir se relever du sol apres une chute est essentiel pour l'autonomie. La technique recommandee par les kinesitherapeutes reduit le risque de blessure secondaire.", "tasks": ["Exercez la technique : rouler sur le cote → position 4 pattes → appui sur un meuble → debout", "Pratiquez 3 fois avec un tapis ou moquette", "Identifiez les meubles stables de votre maison pour s'appuyer"], "tip": "Si vous ne pouvez pas vous relever seul, gardez votre telephone a portee et appelez a l'aide. Le bracelet Chutex a un bouton SOS."},
            "17": {"focus": "Double tache cognitive", "mission": "Les chutes arrivent souvent quand on fait 2 choses a la fois (marcher + parler, marcher + porter). L'entrainement en double tache reduit ce risque de 20% (etude Plummer, 2015).", "tasks": ["Marchez en comptant a rebours de 100 (100, 97, 94...) pendant 2 minutes", "Faites l'appui unipodal en recitant les jours de la semaine a l'envers", "Marchez en portant un verre d'eau (sans renverser) pendant 2 minutes"], "tip": "La double tache est difficile car le cerveau doit gerer l'equilibre ET la tache cognitive. Plus vous pratiquez, plus ca devient automatique."},
            "18": {"focus": "Renforcement avance", "mission": "Les squats, fentes et montees de marche sont les 3 exercices les plus efficaces pour prevenir les chutes (recommandations OMS 2020 pour les +65 ans).", "tasks": ["Squats sans chaise (avec appui mur) : 3 x 8", "Fentes avant : 3 x 5 chaque jambe", "Montees de marche : 3 x 10 chaque jambe (si accessible)"], "tip": "Si les squats sans appui sont difficiles, continuez avec la chaise. La progression doit etre graduelle et sans douleur."},
            "19": {"focus": "Parcours d'obstacles maison", "mission": "Creer un mini-parcours d'obstacles a la maison (coussins au sol, chaises a contourner) reproduit les situations reelles et ameliore l'adaptabilite motrice.", "tasks": ["Creez un parcours avec 3-4 obstacles (coussins, chaise, seuil de porte)", "Faites le parcours 5 fois lentement puis 3 fois un peu plus vite", "Faites-le une derniere fois les yeux mi-clos (proprioception avancee)"], "tip": "Cet exercice ludique est utilise en reeducation professionnelle. Il ameliore la planification motrice et les ajustements posturaux."},
            "20": {"focus": "Routine quotidienne integree", "mission": "L'objectif final est d'integrer les exercices d'equilibre dans votre quotidien : se brosser les dents sur un pied, faire la vaisselle en montant sur les pointes, etc.", "tasks": ["Faites 3 exercices d'equilibre pendant des activites quotidiennes", "Planifiez votre routine d'equilibre de 10 min/jour pour l'apres-programme", "Identifiez les zones a risque chez vous (tapis, fils, eclairage)"], "tip": "Securisez votre domicile : retirez les tapis glissants, fixez les fils electriques, ameliorez l'eclairage nocturne (veilleuses)."},
            "21": {"focus": "Bilan final — Equilibre", "mission": "Vous avez complete 21 jours d'entrainement a l'equilibre. Les etudes montrent une reduction du risque de chute de 30-40% apres un programme de ce type.", "tasks": ["Refaites TOUS les tests du jour 1 et comparez : Romberg, unipodal, assis-debout", "Comparez vos donnees de pas et activite dans l'app", "Celebrez vos progres et continuez 10 min/jour minimum"], "tip": "L'equilibre est une competence qui se maintient. Arretez de le travailler et les gains disparaissent en 6-8 semaines."},
        },
    },
    {
        "id": "prog-mental-21",
        "title": "21 jours pour apaiser l'esprit",
        "subtitle": "Coherence cardiaque, meditation et sante cognitive",
        "icon": "ri-mental-health-line",
        "color": "#8B5CF6",
        "duration_days": 21,
        "category": "bien-etre",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur les neurosciences et la psychologie positive. Le stress chronique accelere le vieillissement cerebral et augmente le risque de demence. Ce programme combine coherence cardiaque, meditation guidee, exercices cognitifs et techniques de gestion du stress pour proteger votre cerveau et ameliorer votre bien-etre.",
        "benefits": [
            "Reduction du cortisol de 23% en 5 minutes de coherence cardiaque (etude McCraty, 2009)",
            "Amelioration de la memoire de travail et de l'attention (+14%, etude Jha, 2010)",
            "Reduction de l'anxiete et amelioration de l'humeur (meta-analyse Goyal, 2014)",
            "Protection contre le declin cognitif lie a l'age",
            "Amelioration de la qualite du sommeil et de la variabilite cardiaque (HRV)",
        ],
        "data_used": ["Niveau de stress", "Variabilite cardiaque (HRV)", "Frequence cardiaque", "Qualite du sommeil", "Score de recuperation"],
        "medical_disclaimer": "Ce programme est un complement au soin, pas un substitut. Si vous souffrez de depression severe, de troubles anxieux diagnostiques ou de traumatismes, consultez un professionnel de sante mentale.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif principal", "type": "choice", "options": ["Reduire mon stress", "Mieux dormir", "Ameliorer ma memoire", "Gerer mon anxiete", "Me sentir plus serein"]},
            {"key": "meditation_exp", "label": "Avez-vous deja pratique la meditation ?", "type": "yesno"},
            {"key": "stress_level", "label": "Comment evaluez-vous votre niveau de stress actuel ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["stress_level", "hrv", "heart_rate", "sleep_quality", "recovery_score"],
        "phases": [
            {"name": "Respiration & Calme", "days": [1, 7], "description": "Maitriser la coherence cardiaque et la respiration anti-stress", "color": "#8B5CF6"},
            {"name": "Meditation & Attention", "days": [8, 14], "description": "Decouvrir la meditation de pleine conscience et les exercices cognitifs", "color": "#7C3AED"},
            {"name": "Integration & Resilience", "days": [15, 21], "description": "Construire sa resilience et ancrer les pratiques au quotidien", "color": "#6D28D9"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Decouvrir la coherence cardiaque", "mission": "La coherence cardiaque est une technique de respiration a 6 cycles/minute (inspire 5s, expire 5s) qui synchronise le coeur et le systeme nerveux. Elle reduit le cortisol de 23% et augmente le DHEA (hormone anti-age) de 100% (etude HeartMath, 2009).", "tasks": ["Pratiquez 5 minutes de coherence cardiaque (inspirez 5s, expirez 5s)", "Faites-le assis, les yeux fermes, en vous concentrant sur le coeur", "Notez votre niveau de stress avant et apres sur 5"], "tip": "La coherence cardiaque optimale = 6 respirations par minute. Comptez mentalement : inspire 1-2-3-4-5, expire 1-2-3-4-5."},
            "2": {"focus": "Le scan corporel", "mission": "Le body scan (relaxation progressive de Jacobson) reduit la tension musculaire de 50% en 10 minutes. Il active le systeme parasympathique et prepare le corps au sommeil (etude Carlson, 2017).", "tasks": ["Body scan de 10 minutes : allonge, parcourez chaque partie du corps", "Contractez puis relacher chaque groupe musculaire (pieds → visage)", "Pratiquez le soir, avant le coucher"], "tip": "Commencez par les pieds, remontez : pieds → mollets → cuisses → ventre → poitrine → mains → bras → epaules → cou → visage."},
            "3": {"focus": "La gratitude", "mission": "Ecrire 3 choses positives par jour augmente le bien-etre de 25% et reduit les symptomes depressifs en 6 semaines (etude Emmons, 2003). La gratitude active le cortex prefrontal et libere de la dopamine.", "tasks": ["Ecrivez 3 choses pour lesquelles vous etes reconnaissant aujourd'hui", "5 minutes de coherence cardiaque le matin", "Notez votre humeur du jour sur 5"], "tip": "Soyez specifique : pas 'ma famille' mais 'l'appel de ma fille ce matin qui m'a fait sourire'. La specificite amplifie l'effet."},
            "4": {"focus": "La respiration 4-7-8", "mission": "La technique 4-7-8 (Dr Andrew Weil) est un tranquillisant naturel du systeme nerveux. Inspire 4s, retention 7s, expire 8s. Elle reduit l'anxiete en 1-2 minutes et facilite l'endormissement.", "tasks": ["Pratiquez la respiration 4-7-8 : 4 cycles le matin, 4 cycles le soir", "5 minutes de coherence cardiaque en complement", "Si anxiete dans la journee, faites 3 cycles de 4-7-8"], "tip": "L'expiration longue (8 secondes) active le nerf vague et le systeme parasympathique — c'est le 'frein' du stress."},
            "5": {"focus": "Introduction a la meditation", "mission": "La meditation de pleine conscience (mindfulness) modifie physiquement le cerveau : le cortex prefrontal (decision) s'epaissit et l'amygdale (peur/stress) se reduit apres 8 semaines (etude Holzel, 2011).", "tasks": ["Meditation guidee de 5 minutes : asseyez-vous, fermez les yeux, concentrez-vous sur votre respiration", "Quand votre esprit vagabonde, ramenez-le doucement a la respiration", "Pas de jugement : c'est normal que l'esprit vagabonde"], "tip": "L'esprit qui vagabonde n'est PAS un echec. Chaque fois que vous le ramenez, vous renforcez le 'muscle' de l'attention."},
            "6": {"focus": "Exercice cognitif — memoire", "mission": "Le cerveau se renforce comme un muscle. Les exercices de memoire augmentent les connexions neuronales et retardent le declin cognitif de 7-14 ans (etude ACTIVE, 2006).", "tasks": ["Apprenez une liste de 10 mots et essayez de la rappeler 1 heure plus tard", "Faites un mot croise ou un sudoku pendant 15 minutes", "Coherence cardiaque 5 minutes le soir"], "tip": "La memoire a court terme diminue avec l'age mais la memoire procedurale (savoir-faire) reste intacte. L'entrainement ralentit le declin."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, votre HRV (variabilite cardiaque) devrait commencer a augmenter — signe que votre systeme nerveux s'equilibre.", "tasks": ["Comparez votre niveau de stress jour 1 vs aujourd'hui", "Verifiez votre HRV dans l'app si vous avez un bracelet", "Evaluez votre qualite de sommeil cette semaine"], "tip": "L'HRV est le meilleur marqueur objectif de la gestion du stress. Plus il est eleve, meilleure est votre resilience."},
            "8": {"focus": "Meditation de pleine conscience — 10 min", "mission": "10 minutes de meditation est le seuil minimum pour observer des effets mesurables sur le cerveau (etude Creswell, 2014). La cle est la regularite, pas la duree.", "tasks": ["Meditation de 10 minutes : concentrez-vous sur les sensations du corps", "Observez vos pensees sans les juger (comme des nuages qui passent)", "Coherence cardiaque 5 minutes en complement"], "tip": "Le matin est le meilleur moment pour mediter — le cerveau est plus receptif et moins encombre de pensees."},
            "9": {"focus": "La marche consciente", "mission": "La marche en pleine conscience combine activite physique et meditation. Elle reduit le cortisol de 40% et ameliore l'humeur plus que la marche normale (etude Stanford, 2020).", "tasks": ["15 minutes de marche consciente : concentrez-vous sur chaque pas, chaque sensation", "Pas de musique ni de conversation — juste vous et vos sensations", "Notez 3 choses que vous avez observees pendant la marche"], "tip": "Sentez le sol sous vos pieds, l'air sur votre peau, les sons autour de vous. C'est la meditation en mouvement."},
            "10": {"focus": "Gestion des pensees negatives", "mission": "Les pensees negatives repetitives (rumination) augmentent le cortisol et le risque de depression. La technique du 'defusion cognitive' (ACT therapy) permet de prendre du recul (etude Hayes, 2012).", "tasks": ["Quand une pensee negative arrive, dites : 'je remarque que je pense que...'", "Ecrivez vos 3 principales ruminations sur papier, puis froissez-le", "5 min de coherence cardiaque pour reset le mental"], "tip": "Ecrire les pensees negatives sur papier et les jeter physiquement est une technique validee pour reduire leur pouvoir."},
            "11": {"focus": "Exercice cognitif — attention", "mission": "L'attention selective (se concentrer sur une chose en ignorant les distractions) decline avec l'age. L'entrainement de l'attention ameliore aussi la memoire et la vitesse de traitement (etude Ball, 2002).", "tasks": ["Exercice : ecoutez une chanson et comptez combien de fois un instrument specifique joue", "Lisez un texte et surlignez mentalement tous les mots de plus de 6 lettres", "10 minutes de meditation centree sur un seul son"], "tip": "L'attention est comme un projecteur : plus vous l'entrainez a se concentrer, plus il devient puissant et precis."},
            "12": {"focus": "La visualisation positive", "mission": "La visualisation active les memes zones cerebrales que l'action reelle (neurones miroirs). Visualiser un lieu paisible reduit l'anxiete de 24% (etude Holmes, 2007).", "tasks": ["Fermez les yeux et visualisez un lieu ou vous etes parfaitement en paix, pendant 5 minutes", "Integrez tous les sens : ce que vous voyez, entendez, sentez, touchez", "5 min de coherence cardiaque apres la visualisation"], "tip": "Votre cerveau ne fait pas la difference entre une experience reelle et une experience vividement imaginee. Utilisez ce pouvoir."},
            "13": {"focus": "Les liens sociaux", "mission": "L'isolement social augmente le risque de demence de 50% et de mortalite de 26% (meta-analyse Holt-Lunstad, 2015). Les interactions sociales sont aussi importantes que l'exercice pour la sante du cerveau.", "tasks": ["Appelez un ami ou un proche que vous n'avez pas contacte depuis longtemps", "Ayez une conversation de plus de 10 minutes (pas par SMS)", "Ecrivez 3 personnes importantes dans votre vie et pourquoi"], "tip": "La qualite des interactions compte plus que la quantite. Une conversation profonde vaut mieux que 10 interactions superficielles."},
            "14": {"focus": "Bilan semaine 2", "mission": "Apres 14 jours, votre cerveau a commence a se restructurer. Les etudes d'imagerie montrent des changements mesurables dans le cortex prefrontal apres 2 semaines de meditation.", "tasks": ["Evaluez votre stress, sommeil et humeur vs jour 1", "Verifiez votre HRV et FC repos dans l'app", "Notez la technique qui vous aide le plus : coherence cardiaque, meditation, gratitude ou visualisation"], "tip": "Votre technique preferee est celle qui marchera le mieux a long terme — parce que vous la pratiquerez."},
            "15": {"focus": "La coherence cardiaque avancee", "mission": "La coherence cardiaque de 10 minutes (vs 5) double les benefices : cortisol -40%, DHEA +150%, IgA (immunite) +50% (etude McCraty, 2003). C'est la dose therapeutique optimale.", "tasks": ["10 minutes de coherence cardiaque complete (3 fois par jour si possible)", "Integrez-la dans votre routine : matin, midi, soir", "Combinez avec la visualisation positive du jour 12"], "tip": "365 : 3 fois par jour, 6 respirations par minute, pendant 5 minutes. C'est la formule de la coherence cardiaque optimale."},
            "16": {"focus": "Meditation de la compassion", "mission": "La meditation de compassion (loving-kindness) active les circuits cerebraux de l'empathie et du bonheur. Elle reduit l'inflammation et ameliore le systeme immunitaire (etude Fredrickson, 2013).", "tasks": ["Meditation de compassion 10 min : souhaitez du bien a vous-meme, puis a un proche, puis a une personne neutre", "Repetez mentalement : 'Que je sois en paix, que je sois heureux, que je sois en bonne sante'", "5 min de coherence cardiaque en fin de seance"], "tip": "Cette meditation parait simple mais elle est extremement puissante. Les moines bouddhistes la pratiquent depuis 2500 ans."},
            "17": {"focus": "L'hygiene numerique", "mission": "Les ecrans et les reseaux sociaux augmentent l'anxiete et fragmentent l'attention. 1 heure de reseaux sociaux augmente l'anxiete de 20% chez les seniors (etude Primack, 2017).", "tasks": ["Limitez les ecrans a 1h maximum aujourd'hui (hors necessites)", "Pas de telephone pendant les repas", "Remplacez 30 min d'ecran par une activite : lecture, marche, conversation"], "tip": "Les notifications sont concues pour creer de l'addiction. Desactivez-les toutes sauf les urgences."},
            "18": {"focus": "La nature comme therapie", "mission": "Le 'bain de foret' (shinrin-yoku) japonais reduit le cortisol de 16%, la tension de 2% et augmente les cellules immunitaires NK de 50% en 3 heures (etude Li, 2010).", "tasks": ["Passez au moins 30 minutes dans la nature (parc, foret, jardin)", "Marchez lentement, observez, respirez profondement", "Coherence cardiaque de 5 min assis dans la nature"], "tip": "Meme un parc urbain a des effets mesurables. Les arbres liberent des phytoncides (huiles essentielles) qui stimulent l'immunite."},
            "19": {"focus": "Construire sa resilience", "mission": "La resilience (capacite a rebondir apres l'adversite) se construit. Les 3 piliers sont : le soutien social, les strategies de coping (gestion) et le sens de la vie (etude Southwick, 2014).", "tasks": ["Identifiez vos 3 forces de caractere principales", "Ecrivez ce qui donne du sens a votre vie en 3 phrases", "5 min de coherence cardiaque + 5 min de meditation de gratitude"], "tip": "La resilience n'est pas l'absence de stress mais la capacite a y faire face. Plus vous pratiquez, plus elle se renforce."},
            "20": {"focus": "Ma routine bien-etre", "mission": "L'objectif est de creer une routine de 15 minutes qui combine vos techniques preferees et que vous maintiendrez au quotidien.", "tasks": ["Creez VOTRE routine de 15 min : choisissez parmi coherence cardiaque, meditation, gratitude, visualisation", "Pratiquez-la ce matin", "Programmez un rappel quotidien permanent"], "tip": "15 min/jour de gestion du stress protege votre cerveau autant que 30 min d'exercice physique protege votre coeur."},
            "21": {"focus": "Bilan final — Serenite", "mission": "Vous avez 21 jours de pratique. Votre cerveau a physiquement change : cortex prefrontal renforce, amygdale moins reactive, HRV augmente.", "tasks": ["Comparez stress, sommeil, HRV et humeur jour 1 vs jour 21", "Evaluez votre serenite globale sur 10", "Partagez vos resultats et votre experience avec vos proches"], "tip": "La meditation est comme l'exercice physique : les benefices s'accumulent avec le temps. 21 jours est un debut, pas une fin."},
        },
    },
    {
        "id": "prog-memory-14",
        "title": "14 jours pour booster sa memoire",
        "subtitle": "Exercices cognitifs et neuroprotection au quotidien",
        "icon": "ri-brain-line",
        "color": "#EC4899",
        "duration_days": 14,
        "category": "cognitif",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur l'etude ACTIVE (Ball, 2002) et les recherches en neuroplasticite. Le cerveau se renforce comme un muscle : les exercices cognitifs cibles augmentent les connexions neuronales et retardent le declin cognitif de 7 a 14 ans. 2 semaines pour stimuler memoire, attention, vitesse de traitement et raisonnement logique.",
        "benefits": [
            "Retard du declin cognitif de 7-14 ans (etude ACTIVE, Ball 2002 — suivi 10 ans)",
            "Amelioration de la memoire de travail de 20-30% (etude Jaeggi, 2008)",
            "Augmentation de la vitesse de traitement cerebral (etude Edwards, 2017)",
            "Amelioration de l'attention selective et de la concentration",
            "Stimulation de la neurogenese hippocampique (nouvelles cellules cerebrales)",
        ],
        "data_used": ["Niveau de stress", "Qualite du sommeil", "Frequence cardiaque au repos", "HRV", "Nombre de pas"],
        "medical_disclaimer": "Ce programme est un complement a un mode de vie sain, pas un traitement medical. Si vous avez des troubles de memoire importants ou un diagnostic neurologique, consultez votre medecin ou un neurologue.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif principal", "type": "choice", "options": ["Ameliorer ma memoire au quotidien", "Prevenir le declin cognitif", "Mieux me concentrer", "Stimuler mon cerveau", "Retrouver de la vivacite mentale"]},
            {"key": "memory_concern", "label": "Avez-vous des oublis frequents ?", "type": "yesno"},
            {"key": "mental_activity", "label": "Faites-vous regulierement des activites intellectuelles (lecture, mots croises, jeux) ?", "type": "yesno"},
            {"key": "memory_rating", "label": "Comment evaluez-vous votre memoire actuelle ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["stress_level", "sleep_quality", "heart_rate", "hrv", "steps"],
        "phases": [
            {"name": "Stimulation", "days": [1, 7], "description": "Exercices de memoire, attention et techniques de memorisation", "color": "#EC4899"},
            {"name": "Neuroprotection", "days": [8, 14], "description": "Habitudes neuroprotectrices et entrainement avance", "color": "#DB2777"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre memoire", "mission": "La memoire comprend plusieurs systemes : memoire de travail (court terme), memoire episodique (souvenirs), memoire semantique (connaissances). L'etude ACTIVE (2002, 2832 participants 65-94 ans) a demontre que l'entrainement cognitif preserve ces fonctions pendant 10+ ans.", "tasks": ["Test : memorisez une liste de 10 mots, puis rappelez-les apres 5 minutes", "Notez combien de mots vous avez retenus (score de reference)", "Faites un mot croise ou un sudoku de 15 minutes"], "tip": "La memoire de travail peut retenir 7 (+/-2) elements simultanement (loi de Miller). Au-dela, il faut des strategies de memorisation."},
            "2": {"focus": "La technique des lieux (methode des loci)", "mission": "La methode des loci est la technique de memorisation la plus ancienne et la plus efficace. Les champions de memoire l'utilisent tous. Elle exploite la memoire spatiale, qui est naturellement tres forte chez l'humain (etude Maguire, 2003).", "tasks": ["Choisissez un trajet que vous connaissez parfaitement (votre maison, votre rue)", "Placez mentalement 5 objets a memoriser le long de ce trajet", "Parcourez mentalement le trajet pour retrouver les 5 objets"], "tip": "Plus l'image mentale est absurde, drole ou emotionnelle, mieux vous la retiendrez. Le cerveau memorise les emotions, pas les faits plats."},
            "3": {"focus": "Attention et concentration", "mission": "L'attention est la porte d'entree de la memoire : si vous n'etes pas attentif, l'information n'est jamais encodee. Les exercices d'attention selective ameliorent la memoire de 25% (etude Ball, 2002).", "tasks": ["Exercice : lisez un texte et comptez mentalement tous les 'e' (2 minutes)", "Exercice : ecoutez une conversation radio et notez 5 informations cles apres", "15 minutes sans aucune distraction : lisez un chapitre de livre avec concentration totale"], "tip": "Le multitache est l'ennemi de la memoire. Le cerveau ne fait pas 2 choses a la fois — il alterne, et chaque alternance coute 40% d'efficacite."},
            "4": {"focus": "Le sommeil et la memoire", "mission": "Le sommeil consolide la memoire : pendant le sommeil profond, l'hippocampe rejoue les souvenirs de la journee et les transfere dans le cortex pour le stockage long terme. Une nuit de 7h30 double la retention (etude Walker, 2009).", "tasks": ["Apprenez quelque chose de nouveau ce soir (10 mots, une recette, un numero)", "Couchez-vous a heure fixe pour maximiser le sommeil profond", "Demain matin, testez votre retention avant de relire"], "tip": "La sieste de 90 minutes (un cycle complet) ameliore la memoire de 20%. Meme une sieste de 6 minutes ameliore la retention (etude Lahl, 2008)."},
            "5": {"focus": "Associations et mnemoniques", "mission": "Le cerveau retient mieux les informations associees a quelque chose de connu. Les moyens mnemotechniques exploitent ce principe : acronymes, phrases, rimes, histoires (etude Worthen, 2006).", "tasks": ["Inventez un acronyme pour retenir votre liste de courses (ex: PORC = Pain, Oeufs, Riz, Cafe)", "Transformez un numero de telephone en histoire (ex: 06 = age du chat, 12 = mois de decembre...)", "Apprenez les 5 planetes visibles a l'oeil nu avec une phrase mnemotechnique"], "tip": "Pour retenir un nom : associez-le immediatement a une image. M. Dupont → un pont. Mme Fleur → un bouquet. Plus c'est visuel, mieux ca marche."},
            "6": {"focus": "Exercice physique et cerveau", "mission": "L'exercice physique augmente le BDNF (Brain-Derived Neurotrophic Factor), la molecule qui fait pousser de nouveaux neurones dans l'hippocampe (siege de la memoire). 30 min de marche augmentent le BDNF de 32% (etude Erickson, 2011).", "tasks": ["30 minutes de marche rapide aujourd'hui", "Pendant la marche, essayez de reciter mentalement ce que vous avez appris hier", "Apres la marche, faites un exercice de memoire (meilleur moment : 30 min apres l'effort)"], "tip": "L'exercice avant l'apprentissage prepare le cerveau (augmente BDNF). L'exercice apres l'apprentissage consolide la memoire. Les deux sont benefiques."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, vos capacites d'attention et vos techniques de memorisation se sont deja ameliorees. Le cerveau forme de nouvelles synapses en 7 jours d'entrainement (neuroplasticite).", "tasks": ["Refaites le test des 10 mots du jour 1 — comparez votre score", "Listez les 3 techniques de memorisation que vous preferez", "Evaluez votre concentration au quotidien sur 5"], "tip": "Si votre score de mots retenus a augmente meme de 1-2 mots, c'est un progres significatif qui montre que votre cerveau repond a l'entrainement."},
            "8": {"focus": "La nutrition du cerveau", "mission": "Le cerveau consomme 20% de l'energie du corps. Les omega-3 (poisson), les polyphenols (baies, the vert), la vitamine E (noix) et les flavonoides (chocolat noir) protegent les neurones (etude MIND Diet, Morris 2015 — reduction du risque d'Alzheimer de 53%).", "tasks": ["Mangez un aliment riche en omega-3 (poisson gras, noix, graines de lin)", "Buvez un the vert (catechines neuroprotectrices)", "Mangez une poignee de myrtilles ou baies (anthocyanes pour l'hippocampe)"], "tip": "Le regime MIND (Mediterranean-DASH Intervention for Neurodegenerative Delay) combine le meilleur des regimes mediterraneen et DASH pour la sante cerebrale."},
            "9": {"focus": "La lecture active", "mission": "La lecture est l'exercice cognitif le plus complet : elle sollicite la memoire, l'attention, l'imagination et le langage simultanement. Lire 30 min/jour reduit le risque de declin cognitif de 32% (etude Wilson, 2013).", "tasks": ["Lisez 30 minutes d'un livre (pas d'ecran) aujourd'hui", "Apres la lecture, resumez ce que vous avez lu en 3 phrases", "Discutez du contenu avec quelqu'un (la discussion ancre la memoire)"], "tip": "La lecture papier est superieure a la lecture sur ecran pour la comprehension et la retention (meta-analyse Delgado, 2018)."},
            "10": {"focus": "Les jeux cognitifs", "mission": "Les jeux de strategie (echecs, bridge, scrabble) stimulent le raisonnement logique et la planification — fonctions du cortex prefrontal. Jouer regulierement retarde le declin cognitif de 5 ans (etude Verghese, 2003).", "tasks": ["Jouez 20 minutes a un jeu de strategie (echecs, mots croises, sudoku avance)", "Essayez un nouveau jeu que vous ne connaissez pas (la nouveaute stimule le cerveau)", "Jouez contre quelqu'un (l'interaction sociale amplifie le benefice)"], "tip": "La nouveaute est le meilleur stimulant cerebral. Quand un jeu devient trop facile, augmentez la difficulte ou changez de jeu."},
            "11": {"focus": "La repetition espacee", "mission": "La courbe de l'oubli (Ebbinghaus, 1885) montre que nous oublions 70% en 24h sans revision. La repetition espacee (reviser a intervalles croissants) est la methode la plus efficace : revision a J+1, J+3, J+7, J+14 (etude Cepeda, 2006).", "tasks": ["Choisissez 10 informations a retenir (capitales, dates, vocabulaire)", "Revisez-les ce soir, puis demain, puis dans 3 jours", "Utilisez des flashcards (un cote = question, autre = reponse)"], "tip": "Les apps de flashcards (Anki) utilisent des algorithmes de repetition espacee. Mais des cartes papier fonctionnent tout aussi bien."},
            "12": {"focus": "Les interactions sociales", "mission": "Les conversations stimulent la memoire de travail, l'attention et le langage simultanement. Les personnes socialement actives ont 70% moins de declin cognitif (etude Rush Memory, Bennett 2006).", "tasks": ["Ayez une conversation approfondie avec quelqu'un (>15 min, pas superficielle)", "Racontez un souvenir detaille a un proche (memoire episodique)", "Appelez quelqu'un que vous n'avez pas appele depuis longtemps"], "tip": "Raconter ses souvenirs renforce la memoire episodique. Plus vous racontez un souvenir, mieux vous le retiendrez."},
            "13": {"focus": "La meditation pour le cerveau", "mission": "La meditation de pleine conscience epaissit le cortex prefrontal (attention, decision) et l'hippocampe (memoire) en 8 semaines. Elle reduit aussi la deterioration de la matiere grise liee a l'age (etude Luders, 2015).", "tasks": ["10 minutes de meditation de pleine conscience (focus sur la respiration)", "Exercice de memoire apres la meditation (le cerveau est plus receptif)", "5 minutes de coherence cardiaque le soir"], "tip": "Mediter avant d'apprendre prepare le cerveau a encoder. L'attention accrue par la meditation ameliore naturellement la memoire."},
            "14": {"focus": "Bilan final — Memoire", "mission": "Apres 14 jours d'entrainement cognitif, votre cerveau a forme de nouvelles connexions synaptiques. L'etude ACTIVE montre que ces gains se maintiennent 10 ans si vous continuez a stimuler votre cerveau.", "tasks": ["Refaites le test des 10 mots — comparez avec jour 1 et jour 7", "Evaluez votre memoire, attention et concentration sur 5 (vs jour 1)", "Planifiez votre routine cognitive quotidienne pour l'apres-programme"], "tip": "Le cerveau a besoin de stimulation continue. 15 min/jour d'exercice cognitif (lecture, jeux, apprentissage) suffisent pour maintenir les gains."},
        },
    },
    {
        "id": "prog-cardio-21",
        "title": "21 jours pour renforcer son coeur",
        "subtitle": "Endurance cardiovasculaire progressive et adaptee",
        "icon": "ri-heart-3-line",
        "color": "#E11D48",
        "duration_days": 21,
        "category": "cardio-endurance",
        "difficulty": "progressif",
        "effort": "20-40 min/jour",
        "description": "Programme base sur les recommandations de l'American Heart Association et les etudes en cardiologie du sport adapte. 3 semaines pour ameliorer votre VO2max, renforcer votre coeur, baisser votre frequence cardiaque au repos et augmenter votre endurance de facon progressive et securisee. Adapte aux seniors et aux personnes en reprise d'activite.",
        "benefits": [
            "Amelioration du VO2max de 15-20% en 3 semaines (meta-analyse Huang, 2016)",
            "Baisse de la frequence cardiaque au repos de 5-10 bpm",
            "Reduction du risque cardiovasculaire de 30-50% (AHA, 2018)",
            "Amelioration de la capacite d'effort et de l'endurance au quotidien",
            "Reduction de la tension arterielle de 5-8 mmHg (effet dose-reponse)",
        ],
        "data_used": ["Frequence cardiaque", "HRV", "Nombre de pas", "Calories brulees", "Score de recuperation", "Tension arterielle"],
        "medical_disclaimer": "Consultez votre medecin avant de commencer si vous avez des antecedents cardiaques, une tension superieure a 160/100 mmHg, des douleurs thoraciques a l'effort ou si vous prenez des betabloquants. Arretez immediatement en cas de douleur thoracique, essoufflement anormal ou vertiges.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Ameliorer mon endurance", "Renforcer mon coeur", "Etre moins essouffle", "Reprendre le sport en douceur", "Prevenir les maladies cardiovasculaires"]},
            {"key": "cardiac_history", "label": "Avez-vous des antecedents cardiaques ?", "type": "yesno"},
            {"key": "current_fitness", "label": "Votre niveau de forme actuel", "type": "choice", "options": ["Sedentaire (essouffle en montant 1 etage)", "Debutant (marche 15-20 min sans probleme)", "Modere (marche 30 min a bon rythme)", "Actif (deja une activite reguliere)"]},
            {"key": "fitness_rating", "label": "Comment evaluez-vous votre endurance actuelle ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["heart_rate", "hrv", "steps", "calories", "recovery_score", "blood_pressure"],
        "phases": [
            {"name": "Activation", "days": [1, 7], "description": "Activer le systeme cardiovasculaire en douceur, etablir la base aerobique", "color": "#E11D48"},
            {"name": "Construction", "days": [8, 14], "description": "Augmenter l'intensite par intervalles, renforcer le debit cardiaque", "color": "#BE123C"},
            {"name": "Endurance", "days": [15, 21], "description": "Consolider l'endurance, allonger les efforts, ancrer les gains", "color": "#9F1239"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre condition cardio", "mission": "Le test de marche de 6 minutes (TM6) est utilise en cardiologie pour evaluer la capacite fonctionnelle. La distance parcourue en 6 min de marche rapide est un indicateur fiable du VO2max (etude ATS, 2002). Normale : 400-700m selon l'age.", "tasks": ["Test de reference : marchez le plus vite possible pendant 6 minutes (sans courir)", "Notez la distance parcourue (comptez les pas x 0.7m ou utilisez un repere connu)", "Notez votre frequence cardiaque au repos ce matin et juste apres le test"], "tip": "Votre FC au repos est le meilleur indicateur de forme cardiovasculaire. Objectif du programme : la baisser de 5-10 bpm."},
            "2": {"focus": "Marche aerobique de base", "mission": "La zone aerobique optimale pour les debutants est 50-60% de la FC max (220 - age). A cette intensite, le coeur travaille suffisamment pour progresser sans risque. C'est la zone de combustion des graisses (etude Achten, 2002).", "tasks": ["25 minutes de marche a rythme soutenu (vous pouvez parler mais pas chanter)", "Surveillez votre FC : visez 50-60% de votre max (ex: 75-90 bpm si max = 150)", "Echauffement 5 min lent + 15 min soutenu + 5 min retour au calme"], "tip": "La regle du parler : si vous pouvez parler normalement, l'intensite est bonne. Si vous etes trop essouffle pour parler, ralentissez."},
            "3": {"focus": "Respiration et effort", "mission": "La respiration diaphragmatique (ventrale) optimise les echanges gazeux et reduit l'essoufflement de 30% a effort egal. Le diaphragme est le muscle principal de la respiration — il s'entraine (etude Bernardi, 2001).", "tasks": ["Pratiquez 5 min de respiration diaphragmatique (le ventre se gonfle a l'inspiration)", "25 min de marche en maintenant la respiration ventrale", "Expirez 2x plus longtemps que vous inspirez pendant l'effort (inspire 2 pas, expire 4 pas)"], "tip": "Respirez par le nez a faible intensite (filtre, rechauffe l'air) et par la bouche a intensite elevee (plus de debit)."},
            "4": {"focus": "Escaliers — exercice roi", "mission": "Monter les escaliers est un exercice cardio 2x plus intense que la marche a plat. 7 minutes d'escaliers par jour reduisent le risque cardiovasculaire de 33% (etude University of Geneva, 2019). C'est l'exercice fonctionnel le plus accessible.", "tasks": ["Montez 4 etages d'escaliers 3 fois (avec pause entre chaque montee)", "Chronometrez votre montee — objectif : reduction progressive", "20 min de marche en complement"], "tip": "Montez a rythme regulier, sans vous arreter en milieu d'etage. La descente est un exercice de freinage musculaire — descendez lentement."},
            "5": {"focus": "Marche avec variations de rythme", "mission": "Le fartlek (jeu de vitesse suedois) alterne marche rapide et marche normale. Cette methode ameliore le VO2max 30% plus vite que la marche continue (meta-analyse Milanovic, 2015) car elle force le coeur a s'adapter a des intensites changeantes.", "tasks": ["30 min de marche avec variations : 2 min rapide, 2 min normal, en alternance", "Pendant les phases rapides, votre FC doit monter de 10-20 bpm au-dessus de votre zone confort", "Terminez par 5 min de marche lente pour le retour au calme"], "tip": "Le fartlek est le precurseur de l'entrainement par intervalles. C'est plus efficace ET plus agreable que la marche continue monotone."},
            "6": {"focus": "Recuperation active", "mission": "La recuperation est aussi importante que l'effort. Le HRV (variabilite cardiaque) mesure votre capacite de recuperation : plus il est eleve, meilleure est votre condition cardiovasculaire (etude Buchheit, 2014).", "tasks": ["Jour leger : 20 min de marche lente + 10 min d'etirements", "Verifiez votre HRV et FC repos dans l'app (comparez avec jour 1)", "Hydratez-vous : 2L d'eau minimum aujourd'hui"], "tip": "Votre FC repos du matin (avant de vous lever) est le meilleur indicateur de recuperation. Si elle est 5+ bpm au-dessus de la normale, reposez-vous."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, les premieres adaptations cardiovasculaires apparaissent : augmentation du volume d'ejection systolique (le coeur pompe plus de sang a chaque battement) et debut de baisse de la FC repos.", "tasks": ["Comparez votre FC repos jour 1 vs aujourd'hui", "Refaites le test de marche 6 min — comparez la distance", "Evaluez votre essoufflement dans les escaliers sur 5 (vs jour 1)"], "tip": "Si votre FC repos a baisse meme de 2-3 bpm, c'est un signe que votre coeur est deja plus efficace."},
            "8": {"focus": "Intervalles structures", "mission": "L'entrainement par intervalles de haute intensite (HIIT) adapte aux seniors est le protocole le plus efficace pour ameliorer le VO2max : +17% en 4 semaines (etude Wisloff, 2007 — protocole 4x4 adapte). Les intervalles courts sont plus surs et mieux toleres.", "tasks": ["Apres 5 min d'echauffement, faites 6 x (1 min marche tres rapide + 2 min marche lente)", "Pendant les phases rapides, vous devez etre essouffle mais pas au maximum", "Terminez par 5 min de marche lente + etirements"], "tip": "Les intervalles courts (30s-1min) sont ideaux pour debuter. Le coeur apprend a monter et descendre rapidement — c'est ca l'entrainement."},
            "9": {"focus": "Endurance continue 35 min", "mission": "L'endurance fondamentale (effort continu a intensite moderee) developpe le reseau capillaire dans les muscles et augmente le nombre de mitochondries — les usines a energie de vos cellules (etude Holloszy, 1967).", "tasks": ["35 minutes de marche continue a rythme soutenu et regulier", "Maintenez le meme rythme du debut a la fin (pas de ralentissement)", "Notez votre FC a 10 min, 20 min et 35 min (elle doit rester stable)"], "tip": "Si votre FC reste stable pendant 35 min d'effort, votre systeme aerobique fonctionne bien. Si elle derive vers le haut, reduisez l'intensite."},
            "10": {"focus": "Renforcement cardio — montees", "mission": "Les cotes et montees augmentent l'intensite cardiaque de 30-50% par rapport a la marche plate. Elles renforcent specifiquement le ventricule gauche (chambre principale du coeur) et les quadriceps (etude Minetti, 2002).", "tasks": ["Trouvez une cote ou une montee douce (rue en pente, chemin, parc)", "Montez 5 fois en marche rapide + descendez en marchant lentement (recuperation)", "20 min de marche plate ensuite pour completer la seance"], "tip": "Penchez-vous legerement en avant dans les montees et raccourcissez vos pas. Expirez a chaque effort."},
            "11": {"focus": "Intervalles pyramidaux", "mission": "Les intervalles en pyramide (30s rapide, 1 min rapide, 2 min rapide, puis descente) stimulent differentes filiere energetiques et ameliorent a la fois la puissance et l'endurance (etude Seiler, 2013).", "tasks": ["Echauffement 5 min, puis pyramide : 30s rapide / 1 min repos, 1 min rapide / 1 min repos, 2 min rapide / 2 min repos, puis redescendez", "Repetez la pyramide 2 fois", "Retour au calme 5 min"], "tip": "La pyramide permet de progresser dans une seance : les premiers intervalles echauffent, le sommet pousse le coeur, la descente consolide."},
            "12": {"focus": "Activite croisee", "mission": "Le cross-training (varier les activites) reduit le risque de blessure de 50% et ameliore la condition physique globale car il sollicite differents groupes musculaires (recommandations ACSM, 2018).", "tasks": ["Aujourd'hui, changez d'activite : velo, natation, velo d'appartement ou danse (30 min)", "Maintenez une intensite moderee (zone de conversation)", "Comparez votre FC avec la marche : elle devrait etre similaire a effort equivalent"], "tip": "La natation est excellente pour le cardio sans impact articulaire. Le velo est ideal pour ceux qui ont des douleurs aux genoux."},
            "13": {"focus": "Marche nordique / Bras + Cardio", "mission": "La marche nordique (avec batons) augmente la depense energetique de 20-30% par rapport a la marche normale et engage 90% des muscles du corps. Elle ameliore le VO2max de 15% en 12 semaines (etude Church, 2002).", "tasks": ["Si possible, marchez avec des batons (ou simulez le mouvement de bras amples)", "35 min de marche avec engagement actif des bras (balancez-les energiquement)", "Maintenez un rythme soutenu regulier"], "tip": "Meme sans batons, le balancement actif des bras augmente la depense cardiaque de 10-15%. Pliez les coudes a 90 degres et balancez."},
            "14": {"focus": "Bilan semaine 2", "mission": "Apres 14 jours, votre VO2max a augmente de 8-12% et votre FC repos devrait avoir baisse de 3-5 bpm. Le ventricule gauche est plus fort et pompe plus de sang a chaque battement.", "tasks": ["Comparez FC repos, HRV et steps jour 1 vs jour 14", "Refaites le test de marche 6 min — objectif : +50m vs jour 1", "Evaluez votre essoufflement dans l'effort quotidien sur 5"], "tip": "A mi-programme, votre coeur est objectivement plus efficace. Les 7 derniers jours vont consolider et maximiser ces gains."},
            "15": {"focus": "Endurance longue — 40 min", "mission": "L'endurance longue (>30 min continu) est la base de l'adaptation cardiovasculaire durable. A partir de 30 min, le corps augmente la production d'oxyde nitrique (vasodilatateur) et de VEGF (facteur de croissance vasculaire) — vos arteres se nettoient (etude Green, 2004).", "tasks": ["40 minutes de marche continue a rythme soutenu", "Ne ralentissez pas — maintenez un rythme regulier", "Notez votre FC a la fin : elle doit etre inferieure a la semaine derniere pour le meme effort"], "tip": "40 min continu est un palier important. Au-dela de 30 min, les benefices vasculaires augmentent de facon exponentielle."},
            "16": {"focus": "Intervalles longs", "mission": "Les intervalles longs (3-4 min d'effort intense) sont le protocole le plus efficace pour le VO2max : le coeur atteint sa capacite maximale pendant l'effort. Le protocole 4x4 (4 min intense, 3 min repos) est le gold standard en cardiologie du sport (etude Rognmo, 2012).", "tasks": ["Echauffement 5 min, puis 4 x (3 min marche tres rapide + 2 min marche lente)", "Pendant les 3 min rapides, visez 70-80% de votre FC max", "Retour au calme progressif 5 min"], "tip": "Ces intervalles sont intenses — c'est normal d'etre tres essouffle pendant les phases rapides. Mais vous ne devez jamais avoir de douleur thoracique."},
            "17": {"focus": "Circuit cardio-renforcement", "mission": "Combiner cardio et renforcement musculaire dans un circuit est plus efficace que les deux separes : il augmente le VO2max ET la force en meme temps (etude Phillips, 2017). Les muscles forts consomment plus d'oxygene, ce qui stimule le coeur.", "tasks": ["Circuit : 2 min marche rapide + 10 squats + 2 min marche rapide + 10 montees pointes + 2 min marche rapide + 10 montees genoux", "Repetez le circuit 3 fois avec 1 min de repos entre chaque", "Finissez par 10 min de marche lente"], "tip": "Le circuit force le coeur a s'adapter a des demandes variees — exactement comme dans la vie quotidienne (monter les courses, jardin, etc.)."},
            "18": {"focus": "Endurance vallonnee", "mission": "Varier le terrain (plat, montee, descente) sollicite le coeur de maniere plus complete que le plat seul. Les montees augmentent la puissance cardiaque, les descentes entrainent le freinage musculaire (etude Vernillo, 2017).", "tasks": ["35-40 min de marche sur un parcours avec du denivele (colline, chemin, parc valonne)", "En montee : raccourcissez les pas, respirez profondement", "En descente : ralentissez, controlez chaque pas (travail musculaire)"], "tip": "Le parcours valonne est ideal car il impose des variations d'intensite naturelles — comme un fartlek automatique."},
            "19": {"focus": "Recuperation et adaptation", "mission": "Les adaptations cardiovasculaires se produisent pendant le REPOS, pas pendant l'effort. L'effort stimule, le repos construit. La supercompensation necessite 24-48h de repos apres un effort intense (etude Bompa, 2009).", "tasks": ["Jour leger : 20 min de marche douce + etirements complets 15 min", "Verifiez votre HRV : il devrait etre plus haut qu'en debut de programme", "Dormez bien ce soir — le sommeil est le meilleur outil de recuperation cardiovasculaire"], "tip": "Si votre HRV est plus haut et votre FC repos plus basse qu'au jour 1, votre coeur est objectivement plus fort."},
            "20": {"focus": "Preparer sa routine cardio durable", "mission": "L'AHA recommande 150 min d'activite moderee OU 75 min d'activite intense par semaine pour la sante cardiovasculaire. C'est environ 30 min 5x/semaine ou 3 seances de 25 min avec intervalles.", "tasks": ["Planifiez votre semaine cardio type : 3 seances de 30-40 min (2 endurance + 1 intervalles)", "Identifiez vos parcours preferes et vos horaires fixes", "Programmez des rappels dans l'app"], "tip": "La constance bat l'intensite. 3 seances moderees par semaine pendant 1 an > 1 mois intense suivi de rien."},
            "21": {"focus": "Bilan final — Coeur plus fort", "mission": "Apres 21 jours, votre coeur est mesurablament plus fort : le volume d'ejection a augmente (plus de sang par battement), le reseau capillaire s'est densifie, et votre FC repos a baisse. Ces gains se maintiennent si vous continuez 2-3 seances/semaine.", "tasks": ["Refaites le test de marche 6 min — comparez avec jour 1 et jour 7", "Comparez FC repos, HRV et tension arterielle jour 1 vs jour 21", "Celebrez vos progres et partagez votre bilan avec vos proches"], "tip": "Chaque bpm de FC repos en moins = un coeur plus efficace. Si vous avez gagne 5 bpm, votre coeur economise environ 7000 battements par jour."},
        },
    },
    {
        "id": "prog-posture-14",
        "title": "14 jours pour ameliorer sa posture",
        "subtitle": "Dos, epaules, cou — exercices correctifs quotidiens",
        "icon": "ri-body-scan-line",
        "color": "#0EA5E9",
        "duration_days": 14,
        "category": "posture",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur les recommandations de la Societe Francaise de Rhumatologie et les etudes en kinesitherapie posturale. La mauvaise posture est responsable de 80% des douleurs dorsales chroniques. 2 semaines d'exercices correctifs cibles pour redresser le dos, ouvrir les epaules, soulager le cou et prevenir les douleurs chroniques.",
        "benefits": [
            "Reduction des douleurs dorsales de 40-60% (meta-analyse Hayden, 2005)",
            "Correction de la cyphose dorsale (dos voute) frequente apres 60 ans",
            "Amelioration de la capacite respiratoire (+12% par correction posturale, etude Lau, 2011)",
            "Prevention des douleurs cervicales et des cephalees de tension",
            "Amelioration de l'equilibre et reduction du risque de chute",
        ],
        "data_used": ["Nombre de pas", "Score de recuperation", "Qualite du sommeil", "Niveau de stress"],
        "medical_disclaimer": "Si vous avez une hernie discale, une stenose spinale, de l'osteoporose severe ou des douleurs aigues avec irradiation dans les bras ou jambes, consultez votre medecin avant de commencer.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Soulager mes douleurs de dos", "Redresser ma posture", "Prevenir les douleurs", "Soulager mon cou et mes epaules", "Me tenir plus droit"]},
            {"key": "pain_area", "label": "Ou avez-vous le plus souvent mal ?", "type": "choice", "options": ["Bas du dos (lombaires)", "Haut du dos (dorsales)", "Cou et epaules", "Plusieurs zones", "Pas de douleur particuliere"]},
            {"key": "pain_level", "label": "Votre niveau de douleur actuel", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["steps", "recovery_score", "sleep_quality", "stress_level"],
        "phases": [
            {"name": "Conscience & Mobilite", "days": [1, 7], "description": "Prendre conscience de sa posture et retrouver la mobilite articulaire", "color": "#0EA5E9"},
            {"name": "Renforcement & Correction", "days": [8, 14], "description": "Renforcer les muscles posturaux et corriger les desequilibres", "color": "#0284C7"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre posture", "mission": "La posture ideale : oreille alignee avec l'epaule, l'epaule avec la hanche, la hanche avec la cheville (vue de profil). La cyphose dorsale (dos voute) augmente de 3 degres par decennie apres 40 ans (etude Kado, 2004) et double le risque de chute.", "tasks": ["Test du mur : dos au mur, verifiez si votre tete, epaules et fesses touchent le mur", "Photo de profil : demandez a quelqu'un de vous photographier debout, de profil", "Notez vos zones de tension : cou, epaules, bas du dos, entre les omoplates"], "tip": "Si votre tete ne touche pas le mur naturellement, vous avez une projection anterieure de la tete — c'est la cause n.1 des douleurs cervicales."},
            "2": {"focus": "Mobilite cervicale", "mission": "Le cou supporte 5kg (poids de la tete). Pour chaque centimetre de projection vers l'avant, la charge augmente de 4.5kg (etude Hansraj, 2014). Un cou penche de 60 degres (position telephone) supporte 27kg.", "tasks": ["Rotations lentes du cou : 10 fois dans chaque sens", "Inclinaisons laterales : oreille vers l'epaule, 10 de chaque cote (sans forcer)", "Rentrez le menton (double menton) et maintenez 5 secondes — repetez 10 fois"], "tip": "Le rentrer de menton (chin tuck) est l'exercice n.1 pour corriger la posture cervicale. Faites-le toutes les heures si vous etes assis longtemps."},
            "3": {"focus": "Ouvrir les epaules", "mission": "Les muscles pectoraux raccourcis (par la position assise) tirent les epaules vers l'avant, creant la posture voutee. Etirer les pectoraux et renforcer les rhomboides (entre les omoplates) corrige ce desequilibre (etude Sahrmann, 2002).", "tasks": ["Etirement pectoral dans l'encadrement de porte : 30 secondes x 3 (bras en L)", "Serrez les omoplates l'une vers l'autre : maintenez 5s, repetez 15 fois", "Bras tendus, faites des cercles vers l'arriere : 20 dans chaque sens"], "tip": "L'etirement dans l'encadrement de porte est le plus efficace pour ouvrir le thorax. Gardez le dos droit et avancez doucement le buste."},
            "4": {"focus": "Le bas du dos — lombaires", "mission": "Les douleurs lombaires touchent 80% de la population. Le renforcement du transverse abdominal (muscle profond du ventre) et des multifides (muscles profonds du dos) est plus efficace que les anti-douleurs a long terme (etude Hides, 2001).", "tasks": ["Chat-vache : a 4 pattes, alternez dos rond (chat) et dos creux (vache), 15 fois", "Pont fessier : allonge, soulevez les hanches, maintenez 5s, 3 x 10", "Gainage ventral : sur les coudes, maintenez 20-30 secondes, 3 fois"], "tip": "Le gainage renforce la gaine abdominale qui protege le dos. Commencez par 15 secondes et augmentez progressivement."},
            "5": {"focus": "Etirements complets de la chaine posterieure", "mission": "La chaine posterieure (mollets, ischio-jambiers, fessiers, dos, nuque) est souvent raccourcie par la position assise prolongee. L'etirer quotidiennement reduit les douleurs dorsales de 50% (etude Sherman, 2011 — yoga vs exercices classiques).", "tasks": ["Etirement des ischio-jambiers : jambe sur une chaise, penchez-vous vers l'avant, 30s chaque jambe", "Etirement du piriforme : assis, cheville sur genou oppose, penchez-vous, 30s chaque cote", "La priere : a genoux, bras tendus devant, abaissez le buste, maintenez 30 secondes"], "tip": "Ne forcez JAMAIS un etirement. La sensation doit etre une tension agreable, jamais une douleur. Respirez profondement pendant l'etirement."},
            "6": {"focus": "Posture au quotidien — assis", "mission": "La position assise prolongee (>6h/jour) augmente le risque de douleurs dorsales de 36% et le risque cardiovasculaire de 18% (meta-analyse Biswas, 2015). Se lever toutes les 30 minutes inverse ces effets.", "tasks": ["Reglez votre chaise : pieds a plat, genoux a 90 degres, ecran a hauteur des yeux", "Levez-vous toutes les 30 minutes et faites 5 etirements du cou", "Utilisez un coussin lombaire si necessaire pour soutenir la courbure naturelle du dos"], "tip": "L'ergonomie du poste assis : bras a 90 degres, ecran a 50-70cm, haut de l'ecran a hauteur des yeux."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, votre conscience posturale a augmente et les premieres tensions ont commence a se relacher. La mobilite articulaire s'ameliore en 7-14 jours.", "tasks": ["Refaites le test du mur du jour 1 — votre tete est-elle plus proche du mur ?", "Evaluez vos douleurs sur 5 (vs jour 1)", "Notez les 3 exercices qui vous font le plus de bien"], "tip": "La conscience posturale est la moitie du travail. Maintenant que vous savez detecter une mauvaise posture, vous pouvez la corriger en temps reel."},
            "8": {"focus": "Renforcement des extenseurs du dos", "mission": "Les muscles extenseurs du dos (erector spinae, multifides) maintiennent le dos droit contre la gravite. Leur faiblesse est la cause principale du dos voute chez les seniors (etude Sinaki, 2002).", "tasks": ["Superman au sol : allonge sur le ventre, soulevez bras et jambes, maintenez 5s, 3 x 8", "Extension dorsale assise : mains derriere la tete, penchez-vous en arriere (moderement), 3 x 10", "Planche laterale : sur le coude, maintenez 15s de chaque cote, 3 fois"], "tip": "Le superman est l'exercice le plus specifique pour les extenseurs du dos. Commencez petit (bras seuls, puis jambes seules, puis les deux)."},
            "9": {"focus": "Mobilite thoracique", "mission": "La colonne thoracique (milieu du dos) se raidit avec l'age, obligeant le cou et les lombaires a compenser — d'ou les douleurs. La mobilisation thoracique reduit les douleurs cervicales de 45% (etude Cleland, 2005).", "tasks": ["Rotation thoracique assise : mains croisees sur la poitrine, tournez le buste 15 fois de chaque cote", "Extension thoracique sur une serviette roulee : allongez-vous dessus (au niveau des omoplates), bras en croix, 2 min", "Cat-cow avec focus thoracique : 15 repetitions lentes"], "tip": "La serviette roulee sous les omoplates est un outil simple et extremement efficace pour ouvrir le thorax."},
            "10": {"focus": "Renforcement de la ceinture abdominale", "mission": "Le transverse abdominal est le corset naturel du corps. Sa faiblesse laisse le ventre se relacher et le dos se vouter. Le renforcer corrige la posture et protege les disques vertebraux (etude Richardson, 1999).", "tasks": ["Vacuum abdominal : expirez completement, rentrez le ventre au maximum, maintenez 10s, 3 x 5", "Gainage lateral : 20s de chaque cote, 3 fois", "Dead bug : allonge, bras et jambes en l'air, abaissez un bras et la jambe opposee en alternance, 3 x 8"], "tip": "Le vacuum (aspiration abdominale) est le seul exercice qui cible specifiquement le transverse. Faites-le le matin a jeun pour plus d'efficacite."},
            "11": {"focus": "Prevention au quotidien — debout et en marchant", "mission": "La posture debout ideale engage legerement les abdominaux, les fessiers et les epaules vers l'arriere. Penser a ces 3 cles pendant la marche corrige 80% des problemes posturaux.", "tasks": ["Marchez 20 min en pensant : ventre legerement rentre, epaules en arriere, menton rentre", "Tous les 5 minutes, verifiez votre posture (utilisez un reflet de vitrine)", "Exercice : marchez avec un livre sur la tete pendant 2 minutes (test d'alignement)"], "tip": "Les 3 cles de la posture debout : 1) Menton rentre 2) Epaules basses et en arriere 3) Nombril vers la colonne."},
            "12": {"focus": "Yoga posture — 5 postures essentielles", "mission": "Le yoga ameliore la posture de 35% et reduit les douleurs dorsales de 56% en 12 semaines (etude Williams, 2009). Les 5 postures suivantes ciblent specifiquement les desequilibres posturaux.", "tasks": ["Posture du chien tete en bas (30s) — etire toute la chaine posterieure", "Posture du cobra (20s x 3) — renforce les extenseurs du dos", "Posture de l'enfant (30s) — detend le bas du dos", "Posture du guerrier II (20s chaque cote) — ouvre les hanches et le thorax", "Torsion assise (20s chaque cote) — mobilise la colonne"], "tip": "Pas besoin d'etre souple pour ces postures. Adaptez selon votre corps — l'important est le mouvement, pas la perfection."},
            "13": {"focus": "Etirements anti-douleur", "mission": "Les etirements ciblent les muscles les plus souvent raccourcis et douloureux : trapeze superieur, sterno-cleido-mastoidien (cou), psoas-iliaque (hanche), piriforme (fessier). 10 min d'etirements quotidiens reduisent les douleurs chroniques de 30% (etude Sihawong, 2011).", "tasks": ["Etirement du trapeze : oreille vers l'epaule, main sur la tete, 30s chaque cote", "Etirement du psoas : fente avant, genou arriere au sol, poussez les hanches en avant, 30s", "Auto-massage des points douloureux avec une balle de tennis contre le mur"], "tip": "La balle de tennis contre le mur est un outil de liberation myofasciale simple et gratuit. Roulez-la sur les points douloureux pendant 1-2 min."},
            "14": {"focus": "Bilan final — Posture", "mission": "Apres 14 jours, votre musculature posturale est plus forte, votre mobilite articulaire s'est amelioree et votre conscience corporelle est transformee. Ces gains se maintiennent avec 10 min/jour.", "tasks": ["Refaites le test du mur et la photo de profil — comparez avec jour 1", "Evaluez vos douleurs sur 5 (vs jour 1)", "Creez votre routine posturale de 10 min pour la suite (3 etirements + 2 renforcements)"], "tip": "10 minutes par jour suffisent pour maintenir les gains. Le plus important est de PENSER a votre posture au quotidien — la conscience est permanente."},
        },
    },
    {
        "id": "prog-respiration-14",
        "title": "14 jours pour mieux respirer",
        "subtitle": "Capacite pulmonaire, souffle et respiration therapeutique",
        "icon": "ri-lungs-line",
        "color": "#14B8A6",
        "duration_days": 14,
        "category": "respiratoire",
        "difficulty": "facile",
        "effort": "15-20 min/jour",
        "description": "Programme base sur les recherches en pneumologie et en techniques respiratoires therapeutiques. La capacite pulmonaire diminue de 1-2% par an apres 50 ans. 2 semaines pour ameliorer votre souffle, renforcer votre diaphragme, maitriser les techniques de respiration therapeutique et augmenter votre endurance respiratoire au quotidien.",
        "benefits": [
            "Augmentation de la capacite vitale de 10-15% (etude Bernardi, 2001)",
            "Reduction de l'essoufflement a l'effort de 30-40%",
            "Amelioration de la saturation en oxygene (SpO2) de 1-2%",
            "Reduction de l'anxiete et du stress par le controle respiratoire",
            "Renforcement du diaphragme et des muscles intercostaux",
        ],
        "data_used": ["SpO2", "Frequence cardiaque", "HRV", "Niveau de stress", "Qualite du sommeil"],
        "medical_disclaimer": "Si vous avez de l'asthme severe, une BPCO diagnostiquee, une insuffisance respiratoire ou cardiaque, consultez votre pneumologue avant de commencer. Arretez tout exercice en cas d'essoufflement anormal, de vertiges ou de douleur thoracique.",
        "onboarding_fields": [
            {"key": "goal", "label": "Votre objectif", "type": "choice", "options": ["Etre moins essouffle", "Ameliorer mon souffle", "Mieux gerer mon stress par la respiration", "Augmenter mon endurance", "Prevenir les problemes pulmonaires"]},
            {"key": "breathing_issue", "label": "Etes-vous souvent essouffle dans l'effort quotidien ?", "type": "yesno"},
            {"key": "breath_rating", "label": "Comment evaluez-vous votre souffle actuel ?", "type": "rating", "max": 5},
        ],
        "tracked_metrics": ["spo2", "heart_rate", "hrv", "stress_level", "sleep_quality"],
        "phases": [
            {"name": "Conscience & Diaphragme", "days": [1, 7], "description": "Decouvrir la respiration diaphragmatique et evaluer sa capacite", "color": "#14B8A6"},
            {"name": "Renforcement & Techniques", "days": [8, 14], "description": "Renforcer les muscles respiratoires et maitriser les techniques avancees", "color": "#0D9488"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Evaluer votre respiration", "mission": "La respiration normale est de 12-20 cycles/min au repos. La plupart des gens respirent trop vite et trop superficiellement (respiration thoracique haute). La respiration diaphragmatique (ventrale) utilise 70% du volume pulmonaire vs 30% pour la respiration thoracique (etude Courtney, 2009).", "tasks": ["Test de reference : comptez vos respirations pendant 1 minute au repos (ne les modifiez pas)", "Test d'apnee : inspirez normalement, puis retenez votre souffle — notez la duree en secondes", "Observez : quand vous respirez, est-ce votre ventre ou votre poitrine qui bouge ?"], "tip": "Apnee de reference : <20s = capacite faible, 20-40s = moyenne, >40s = bonne. L'objectif est d'ameliorer ce score de 10-20s en 14 jours."},
            "2": {"focus": "La respiration diaphragmatique", "mission": "Le diaphragme est le muscle principal de la respiration. Quand il descend a l'inspiration, il cree un vide qui aspire l'air dans les poumons. 70% des gens n'utilisent pas correctement leur diaphragme (etude Bradley, 2007). Le reapprendre change tout.", "tasks": ["Allonge, posez une main sur le ventre et une sur la poitrine", "Inspirez par le nez : SEUL le ventre doit se gonfler (la poitrine reste immobile)", "Pratiquez 5 minutes matin et soir — 10 respirations diaphragmatiques profondes"], "tip": "Si la poitrine bouge, vous respirez avec les muscles accessoires (cou, epaules) — c'est inefficace et fatiguant. Le ventre doit se gonfler comme un ballon."},
            "3": {"focus": "Respiration nasale et filtration", "mission": "Respirer par le nez filtre, rechauffe et humidifie l'air (3 fonctions essentielles). La respiration nasale produit aussi de l'oxyde nitrique (NO) qui dilate les bronches et ameliore l'absorption d'oxygene de 10-15% (etude Lundberg, 1995).", "tasks": ["Pratiquez la respiration exclusivement nasale pendant 1 heure (meme a l'effort leger)", "10 respirations nasales profondes : inspirez 4s par le nez, expirez 6s par le nez", "Verifiez votre SpO2 dans l'app avant et apres l'exercice"], "tip": "La bouche est faite pour manger et parler, le nez est fait pour respirer. Respirez par le nez meme pendant la marche — vous vous adapterez en quelques jours."},
            "4": {"focus": "L'expiration complete", "mission": "La plupart des gens expirent seulement 70% de l'air. Les 30% restants (air residuel) empechent un renouvellement complet. L'expiration forcee (souffler jusqu'au bout) entraine les muscles expiratoires et augmente le volume utile de 20% (etude Weiner, 2003).", "tasks": ["Exercice : inspirez profondement, puis expirez le plus longtemps possible en comptant les secondes", "Soufflez dans une paille pendant 30 secondes (resistance expiratoire)", "Repetez 10 fois l'expiration longue : inspirez 3s, expirez 8-10s"], "tip": "La paille est un outil de reeducation respiratoire utilise en pneumologie. Elle force les muscles expiratoires a travailler contre une resistance."},
            "5": {"focus": "Coherence cardiaque respiratoire", "mission": "La coherence cardiaque a 6 respirations/minute (inspire 5s, expire 5s) synchronise le rythme cardiaque et respiratoire. Elle augmente le HRV de 50%, reduit le cortisol de 23% et ameliore la saturation en oxygene (etude McCraty, 2009).", "tasks": ["5 minutes de coherence cardiaque : inspirez 5s par le nez, expirez 5s par la bouche", "Repetez 3 fois dans la journee (matin, midi, soir) = 15 min au total", "Verifiez votre HRV et stress dans l'app apres chaque seance"], "tip": "Formule 365 : 3 fois par jour, 6 respirations par minute, pendant 5 minutes. C'est la dose therapeutique optimale validee par les etudes."},
            "6": {"focus": "Expansion thoracique", "mission": "La cage thoracique perd en mobilite avec l'age (calcification des cartilages costaux). Les exercices d'expansion thoracique augmentent la compliance pulmonaire et le volume inspiratoire de 15% en 4 semaines (etude Lanza, 2013).", "tasks": ["Inspirez en ecartant les bras vers l'arriere (ouvrir le thorax), expirez en ramenant, 15 fois", "Mains sur les cotes, inspirez en poussant les mains vers l'exterieur, 10 fois", "Rotation du buste en inspirant : 10 de chaque cote"], "tip": "Ces exercices sont prescrits par les kinesitherapeutes respiratoires post-chirurgie thoracique. Ils sont simples mais tres efficaces."},
            "7": {"focus": "Bilan semaine 1", "mission": "Apres 7 jours, votre diaphragme est plus actif, votre respiration plus profonde et votre conscience respiratoire transformee. Les adaptations musculaires commencent.", "tasks": ["Refaites le test d'apnee du jour 1 — comparez (objectif : +5-10 secondes)", "Comptez vos respirations/minute — devrait etre plus bas qu'au jour 1", "Evaluez votre essoufflement dans les escaliers sur 5 (vs jour 1)"], "tip": "Si votre apnee a augmente et vos respirations par minute ont diminue, votre respiration est plus efficace — chaque respiration apporte plus d'oxygene."},
            "8": {"focus": "Respiration a levres pincees", "mission": "La technique des levres pincees (pursed lip breathing) est utilisee en pneumologie pour les patients BPCO. Elle maintient les voies aeriennes ouvertes plus longtemps pendant l'expiration, augmentant les echanges gazeux de 10% (etude Bianchi, 2004).", "tasks": ["Inspirez 2 secondes par le nez", "Expirez 4-6 secondes par les levres pincees (comme si vous souffliez sur une bougie sans l'eteindre)", "Pratiquez pendant 5 minutes, puis pendant une marche de 10 minutes"], "tip": "Les levres pincees creent une resistance qui maintient une pression positive dans les poumons — ca empeche les bronches de se fermer pendant l'expiration."},
            "9": {"focus": "Respiration et marche", "mission": "Synchroniser la respiration avec la marche optimise l'apport en oxygene pendant l'effort. Le pattern optimal est inspire sur 2-3 pas, expire sur 3-4 pas (etude Bernardi, 1998). Cela reduit l'essoufflement de 25%.", "tasks": ["Marche respiratoire 20 min : inspirez sur 2 pas, expirez sur 3 pas", "Si c'est facile : inspirez sur 2, expirez sur 4 pas", "Comparez votre essoufflement avec une marche sans controle respiratoire"], "tip": "L'expiration plus longue que l'inspiration active le parasympathique pendant l'effort — vous recuparez PENDANT que vous marchez."},
            "10": {"focus": "Renforcement inspiratoire", "mission": "Les muscles inspiratoires (diaphragme, intercostaux externes) peuvent etre renforces comme n'importe quel muscle. Un entrainement de 15 min/jour augmente la force inspiratoire de 20-30% en 4 semaines (meta-analyse Beaumont, 2018).", "tasks": ["Inspirez contre resistance : pincez le nez partiellement et inspirez fort, 3 x 10", "Inspirez le plus profondement possible, maintenez 3s, puis expirez lentement, 10 fois", "Gonflez un ballon de baudruche 5 fois (excellent exercice de resistance expiratoire)"], "tip": "Gonfler un ballon est prescrit par les kinesitherapeutes respiratoires post-operatoires. C'est ludique et tres efficace pour les muscles expiratoires."},
            "11": {"focus": "Respiration 4-7-8 et anti-stress", "mission": "La technique 4-7-8 du Dr Andrew Weil est un tranquillisant naturel. Inspire 4s, retention 7s, expire 8s. La retention de souffle augmente les echanges gazeux et la pression partielle en O2 dans le sang (etude Jerath, 2006).", "tasks": ["4 cycles de respiration 4-7-8 le matin (inspire 4s, retient 7s, expire 8s)", "4 cycles avant le dejeuner", "4 cycles le soir avant le coucher"], "tip": "La retention de 7 secondes est le moment cle : elle force les poumons a mieux absorber l'oxygene. Commencez par 4-4-6 si 4-7-8 est trop difficile."},
            "12": {"focus": "Respiration et SpO2", "mission": "La saturation en oxygene (SpO2) normale est >95%. Des exercices respiratoires reguliers ameliorent la SpO2 de 1-2% chez les personnes avec des valeurs limites (93-96%). Pour les seniors, chaque % compte pour la vitalite cerebrale.", "tasks": ["Mesurez votre SpO2 au repos avec votre bracelet", "Faites 10 respirations diaphragmatiques profondes, puis remesurez", "Notez la difference — meme 1% est significatif"], "tip": "La SpO2 augmente temporairement de 1-3% apres des respirations profondes. Si elle est toujours <94% au repos malgre les exercices, consultez votre medecin."},
            "13": {"focus": "Routine respiratoire complete", "mission": "Combiner diaphragmatique + coherence cardiaque + expansion thoracique dans une routine de 15 min est plus efficace que chaque technique isolee (etude Ma, 2017 — review systematique de 15 etudes).", "tasks": ["Routine complete : 3 min diaphragmatique + 5 min coherence cardiaque + 3 min expansion + 4 min levres pincees", "Pratiquez cette routine 2 fois aujourd'hui (matin + soir)", "Notez votre bien-etre general sur 5 apres chaque session"], "tip": "Cette routine de 15 minutes est votre outil de sante pulmonaire pour la vie. 2 fois par jour est l'ideal, 1 fois est le minimum."},
            "14": {"focus": "Bilan final — Souffle", "mission": "Apres 14 jours, votre diaphragme est plus fort, votre capacite pulmonaire a augmente et votre controle respiratoire est transforme. Les gains continuent si vous pratiquez 10-15 min/jour.", "tasks": ["Refaites le test d'apnee — objectif : +10-20 secondes vs jour 1", "Comptez vos respirations/minute — objectif : 2-4 de moins qu'au jour 1", "Verifiez votre SpO2 au repos et comparez avec le jour 1"], "tip": "Chaque seconde de plus en apnee = un systeme respiratoire plus efficace. Si vous avez gagne 15 secondes, vos poumons utilisent mieux chaque respiration."},
        },
    },
]


@router.on_event("startup")
async def seed_programs():
    for p in SEED_PROGRAMS:
        existing = await db.programs.find_one({"id": p["id"]})
        if existing:
            # Update metadata ONLY — never overwrite daily_tasks_template (contains generated guided_steps)
            update = {k: v for k, v in p.items() if k not in ("id", "daily_tasks_template")}
            if update:
                await db.programs.update_one({"id": p["id"]}, {"$set": update})
        else:
            await db.programs.insert_one(p)


@router.get("/programs/catalog")
async def get_program_catalog(user=Depends(get_current_user)):
    """Get available programs"""
    programs = await db.programs.find({}, {"_id": 0, "daily_tasks_template": 0}).to_list(20)
    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    return {"programs": programs, "active_enrollment": active}


@router.get("/programs/detail/{program_id}")
async def get_program_detail(program_id: str):
    """Get full program details for presentation screen (no auth)"""
    program = await db.programs.find_one({"id": program_id}, {"_id": 0, "daily_tasks_template": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    return program


@router.get("/programs/daily-feedback")
async def get_daily_feedback(user=Depends(get_current_user)):
    """Generate AI feedback based on bracelet/scale data for active program"""
    uid = user['id']
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not enrollment:
        return {"has_feedback": False}

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        return {"has_feedback": False}

    # Build enriched context using Nora
    from services.nora_context import build_nora_context, format_nora_context_for_prompt
    nora_ctx = await build_nora_context(user)
    user_context = format_nora_context_for_prompt(nora_ctx)

    # Build program-specific context
    ctx_parts = [f"Programme: {program.get('title','')}, Jour {enrollment.get('current_day', 1)}/{program.get('duration_days', 21)}."]

    # Onboarding context
    onb = enrollment.get("onboarding", {})
    if onb.get("goal"): ctx_parts.append(f"Objectif: {onb['goal']}.")
    if onb.get("wake_time"): ctx_parts.append(f"Reveil cible: {onb['wake_time']}.")

    program_ctx = " ".join(ctx_parts)
    has_data = nora_ctx.get("has_any_data", False)

    feedback = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json

            if has_data:
                prompt = f"""Medecin specialiste du sommeil et de la longevite. Contexte patient et programme:

PATIENT:
{user_context}

PROGRAMME EN COURS: {program_ctx}

Genere un feedback quotidien personnalise en JSON. Base-toi UNIQUEMENT sur les donnees reelles du patient. Vouvoyez le patient. Pas d'emoji.
{{"message": "2-3 phrases medicalement pertinentes basees sur les donnees reelles, adaptees au jour du programme et a l'age du patient", "mood_indicator": "good/neutral/warning", "tip": "1 recommandation concrete et scientifiquement prouvee pour ameliorer le sommeil, adaptee au profil du patient"}}"""
            else:
                prompt = f"""Medecin specialiste du sommeil. Le patient suit le programme "{program.get('title','')}" (jour {enrollment.get('current_day', 1)}/{program.get('duration_days', 21)}) mais n'a PAS encore de donnees de sante mesurees.

PATIENT: {nora_ctx['user_profile'].get('name', 'Patient')}, {nora_ctx.get('age', '?')} ans.

Genere un feedback qui reconnait l'absence de donnees et encourage a connecter les appareils. JSON uniquement. Vouvoyez. Pas d'emoji.
{{"message": "2 phrases: reconnaitre l'absence de donnees + encourager la mesure", "mood_indicator": "neutral", "tip": "1 conseil pour le programme du jour, meme sans donnees"}}"""

            chat = LlmChat(api_key=api_key, session_id=f"fb-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin du sommeil et longevite. JSON uniquement. Pas d'emoji. Ton professionnel.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            feedback = json.loads(r.strip())
        except Exception as e:
            print(f"Daily feedback AI err: {e}")

    if not feedback:
        if has_data:
            feedback = {"message": "Votre regularite dans le programme est essentielle pour observer des ameliorations mesurables.", "mood_indicator": "neutral", "tip": "Maintenez un horaire de coucher regulier ce soir."}
        else:
            feedback = {"message": "Connectez votre bracelet Elio pour que Nora puisse analyser votre sommeil et personnaliser vos recommandations.", "mood_indicator": "neutral", "tip": "Appliquez les conseils du programme meme sans donnees — les benefices viendront."}

    return {"has_feedback": True, "feedback": feedback}


@router.post("/programs/start/{program_id}")
async def start_program(program_id: str, data: dict = {}, user=Depends(get_current_user)):
    """Start a program with optional onboarding data + save health snapshot"""
    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}
    )
    if active:
        raise HTTPException(status_code=400, detail="Vous avez deja un programme actif. Terminez-le d'abord.")

    # Capture health snapshot at start
    snapshot = await _capture_health_snapshot(user['id'])

    enrollment_id = str(uuid.uuid4())
    enrollment = {
        "id": enrollment_id,
        "user_id": user['id'],
        "program_id": program_id,
        "status": "active",
        "current_day": 1,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "streak": 0,
        "completed_days": [],
        "checkins": [],
        "mode": data.get("mode", "solo"),
        "onboarding": data.get("onboarding", {}),
        "health_snapshot_start": snapshot,
    }
    await db.program_enrollments.insert_one(enrollment)
    enrollment.pop("_id", None)
    return {"status": "started", "enrollment": enrollment}


async def _capture_health_snapshot(user_id: str) -> dict:
    """Capture current health metrics for before/after comparison."""
    snapshot = {"captured_at": datetime.now(timezone.utc).isoformat()}
    bracelet = await db.device_readings.find_one(
        {"user_id": user_id, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    scale = await db.device_readings.find_one(
        {"user_id": user_id, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if bracelet and bracelet.get("data"):
        bd = bracelet["data"]
        for k in ["heart_rate", "hrv", "spo2", "steps", "calories", "stress_level", "recovery_score", "sleep_quality", "temperature"]:
            if bd.get(k): snapshot[k] = bd[k]
        if bd.get("blood_pressure"): snapshot["blood_pressure"] = bd["blood_pressure"]
    if scale and scale.get("data"):
        sd = scale["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age"]:
            if sd.get(k): snapshot[k] = sd[k]
    return snapshot


@router.get("/programs/active")
async def get_active_program(user=Depends(get_current_user), day: int = 0):
    """Get active program with today's tasks. Use ?day=X to simulate a specific day."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"active": False}

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        return {"active": False}

    # Calculate current day - allow override for simulation
    if day > 0:
        current_day = min(day, program["duration_days"])
    else:
        try:
            started = datetime.fromisoformat(enrollment["started_at"].replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - started).days + 1
            current_day = min(days_since, program["duration_days"])
        except:
            current_day = enrollment.get("current_day", 1)

    # Update current day
    if current_day != enrollment.get("current_day"):
        await db.program_enrollments.update_one(
            {"id": enrollment["id"]}, {"$set": {"current_day": current_day}}
        )

    # Check if program is completed
    if current_day > program["duration_days"]:
        await db.program_enrollments.update_one(
            {"id": enrollment["id"]}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"active": False, "just_completed": True, "program_title": program["title"]}

    # Get today's tasks
    day_key = str(current_day)
    tasks_template = program.get("daily_tasks_template", {})
    today_tasks = tasks_template.get(day_key, None)

    # If no specific tasks for this day, generate with AI
    if not today_tasks:
        today_tasks = {
            "focus": f"Jour {current_day} - Continue tes efforts",
            "tasks": ["Applique les habitudes apprises", "Note tes observations", "Felicite-toi pour ta regularite"],
            "tip": "La constance est la cle du succes.",
        }

    # ── Personalize tasks with Nora based on user profile ──
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"{enrollment['id']}_{today_str}_{day_key}"
    cached_personalized = await db.personalized_tasks_cache.find_one({"cache_key": cache_key}, {"_id": 0})

    if cached_personalized and cached_personalized.get("tasks"):
        today_tasks = cached_personalized["tasks"]
        # ALWAYS reload guided_steps from the original template (never from cache)
        original_gs = tasks_template.get(day_key, {}).get("guided_steps", {})
        if original_gs:
            today_tasks["guided_steps"] = original_gs
    else:
        # Save original guided_steps BEFORE personalization
        original_guided_steps = tasks_template.get(day_key, {}).get("guided_steps", {})

        # Personalize text via GPT
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if api_key:
            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage
                import json as _json

                age = None
                dob = user.get('date_of_birth', '')
                if dob:
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
                        try:
                            born = datetime.strptime(dob, fmt)
                            age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                            break
                        except ValueError:
                            continue

                profile = f"Age: {age or '?'} ans, Sexe: {user.get('gender', '?')}, Poids: {user.get('weight_kg', '?')}kg, Taille: {user.get('height_cm', '?')}cm"
                if user.get('medical_conditions'):
                    profile += f", Pathologies: {user['medical_conditions']}"
                if user.get('allergies') and user['allergies'].lower() != 'aucune':
                    profile += f", Allergies: {user['allergies']}"

                tasks_list = today_tasks.get("tasks", [])
                prompt = f"""Adapte ce programme au profil. JSON. Garde exactement {len(tasks_list)} taches.

PROFIL: {profile}
PROGRAMME: {program['title']}, Jour {day_key}
FOCUS: {today_tasks.get('focus', '')}
TACHES: {_json.dumps(tasks_list, ensure_ascii=False)}
TIP: {today_tasks.get('tip', '')}

Adapte intensite, duree, precautions selon le profil (age, pathologies).
Vouvoiement pour +50 ans. Precautions si pathologie grave.
JSON: {{"focus": "...", "mission": "1-2 phrases contexte medical", "tasks": ["tache 1 adaptee", "tache 2 adaptee", "tache 3 adaptee"], "tip": "conseil adapte"}}"""

                chat = LlmChat(api_key=api_key, session_id=f"pt-{cache_key[:16]}",
                    system_message="Nora. Adapte programme sante au profil. JSON uniquement. Court.").with_model("openai", "gpt-5.2")
                r = (await chat.send_message(UserMessage(text=prompt))).strip()
                if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
                if r.endswith("```"): r = r[:-3]
                personalized = _json.loads(r.strip())

                if personalized.get("tasks") and isinstance(personalized["tasks"], list):
                    # Ensure tasks are strings
                    clean_tasks = []
                    for t in personalized["tasks"]:
                        if isinstance(t, str):
                            clean_tasks.append(t)
                        elif isinstance(t, dict):
                            clean_tasks.append(t.get("title") or t.get("task") or str(t))
                    personalized["tasks"] = clean_tasks
                    # DO NOT store guided_steps in cache — always use template original
                    personalized.pop("guided_steps", None)
                    today_tasks = personalized

                    await db.personalized_tasks_cache.update_one(
                        {"cache_key": cache_key},
                        {"$set": {"cache_key": cache_key, "tasks": today_tasks, "created_at": today_str}},
                        upsert=True
                    )
                    # Re-inject guided_steps from template AFTER caching
                    today_tasks["guided_steps"] = original_guided_steps
            except Exception as e:
                print(f"Program personalization error: {e}")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_checkin = await db.program_checkins.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )

    # Calculate streak
    completed_days = enrollment.get("completed_days", [])
    streak = len(completed_days)

    # Current phase
    current_phase = None
    for phase in program.get("phases", []):
        if phase["days"][0] <= current_day <= phase["days"][1]:
            current_phase = phase
            break

    # Team info if in a team
    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "program_id": program["id"], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    team_info = None
    if team:
        today_str_team = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        team_members = []
        for m in team.get("members", []):
            # Get today's checkin for each member
            m_checkin = await db.program_checkins.find_one(
                {"user_id": m["user_id"], "date": today_str_team}, {"_id": 0}
            )
            team_members.append({
                "name": m["name"],
                "user_id": m["user_id"],
                "is_me": m["user_id"] == user['id'],
                "checked_in_today": bool(m_checkin),
                "tasks_done_today": len(m_checkin.get("tasks_done", [])) if m_checkin else 0,
                "mood_today": m_checkin.get("mood") if m_checkin else None,
            })
        team_info = {
            "team_id": team["id"],
            "invite_code": team["invite_code"],
            "members": team_members,
            "members_count": len(team_members),
        }

    # Enrich tasks with interactive types
    task_list = today_tasks.get("tasks", [])
    today_tasks["interactive"] = enrich_tasks_interactive(task_list, program.get("category", ""))

    # Load saved task progress for today (auto-saved tasks)
    today_str_prog = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    task_progress = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str_prog}, {"_id": 0}
    )

    return {
        "active": True,
        "enrollment_id": enrollment["id"],
        "program": {
            "id": program["id"],
            "title": program["title"],
            "icon": program["icon"],
            "color": program["color"],
            "duration_days": program["duration_days"],
            "phases": program.get("phases", []),
        },
        "current_day": current_day,
        "current_phase": current_phase,
        "today_tasks": today_tasks,
        "today_checkin": today_checkin,
        "task_progress": task_progress,
        "streak": streak,
        "progress_pct": round((current_day / program["duration_days"]) * 100),
        "started_at": enrollment["started_at"],
        "team": team_info,
    }


@router.post("/programs/save-task")
async def save_task_progress(data: dict, user=Depends(get_current_user)):
    """Save individual task completion immediately (auto-save)."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Aucun programme actif")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    task_index = data.get("task_index", -1)
    rating = data.get("rating", 0)
    notes = data.get("notes", {})

    existing = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )

    if existing:
        indices = existing.get("tasks_done_indices", [])
        if task_index >= 0 and task_index not in indices:
            indices.append(task_index)
        ratings = existing.get("task_ratings", {})
        if task_index >= 0 and rating > 0:
            ratings[str(task_index)] = rating
        all_notes = existing.get("notes", {})
        all_notes.update(notes)
        await db.program_task_progress.update_one(
            {"enrollment_id": enrollment["id"], "date": today_str},
            {"$set": {"tasks_done_indices": indices, "task_ratings": ratings, "notes": all_notes, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.program_task_progress.insert_one({
            "enrollment_id": enrollment["id"],
            "user_id": user['id'],
            "date": today_str,
            "day": enrollment.get("current_day", 1),
            "tasks_done_indices": [task_index] if task_index >= 0 else [],
            "task_ratings": {str(task_index): rating} if task_index >= 0 and rating > 0 else {},
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"status": "saved"}


@router.post("/programs/apply-onboarding")
async def apply_onboarding_to_app(data: dict, user=Depends(get_current_user)):
    """Apply onboarding answers to app features (reminders, objectives, health data)."""
    onboarding = data.get("onboarding", {})
    program_id = data.get("program_id", "")
    actions_done = []

    # Bedtime → create reminder
    if onboarding.get("bedtime_current"):
        bedtime = onboarding["bedtime_current"]
        await db.reminders.update_one(
            {"user_id": user['id'], "type": "programme_coucher"},
            {"$set": {
                "id": str(uuid.uuid4()),
                "user_id": user['id'],
                "type": "programme_coucher",
                "title": "Heure de coucher programme",
                "message": f"Il est temps de commencer votre rituel du soir",
                "time": bedtime,
                "enabled": True,
                "days": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source": "programme",
                "program_id": program_id,
            }},
            upsert=True,
        )
        actions_done.append({"type": "reminder", "label": f"Rappel coucher a {bedtime}"})

    # Wake time → create wake reminder
    if onboarding.get("wake_time"):
        wake = onboarding["wake_time"]
        await db.reminders.update_one(
            {"user_id": user['id'], "type": "programme_reveil"},
            {"$set": {
                "id": str(uuid.uuid4()),
                "user_id": user['id'],
                "type": "programme_reveil",
                "title": "Reveil programme",
                "message": "Bonjour ! Pensez a vous exposer a la lumiere naturelle dans les 30 prochaines minutes",
                "time": wake,
                "enabled": True,
                "days": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source": "programme",
                "program_id": program_id,
            }},
            upsert=True,
        )
        actions_done.append({"type": "reminder", "label": f"Rappel reveil a {wake}"})

    # Save onboarding data as health baseline
    if onboarding.get("sleep_quality") or onboarding.get("diet_quality"):
        await db.program_health_baselines.update_one(
            {"user_id": user['id'], "program_id": program_id},
            {"$set": {
                "user_id": user['id'],
                "program_id": program_id,
                "onboarding": onboarding,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        actions_done.append({"type": "baseline", "label": "Donnees initiales enregistrees"})

    return {"status": "ok", "actions": actions_done}


@router.get("/programs/team/leaderboard")
async def team_leaderboard(user=Depends(get_current_user)):
    """Get team leaderboard for active program."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"leaderboard": []}

    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "program_id": enrollment["program_id"], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    if not team:
        return {"leaderboard": []}

    leaderboard = []
    for m in team.get("members", []):
        # Count total checkins for this member
        checkins = await db.program_checkins.count_documents({"user_id": m["user_id"], "program_id": enrollment["program_id"]})
        # Count total tasks done
        task_docs = await db.program_task_progress.find({"user_id": m["user_id"]}).to_list(100)
        total_tasks = sum(len(d.get("tasks_done_indices", [])) for d in task_docs)
        # Calculate streak (consecutive days)
        streak = 0
        today = datetime.now(timezone.utc).date()
        for d in range(30):
            check_date = (today - timedelta(days=d)).isoformat()
            has = await db.program_checkins.find_one({"user_id": m["user_id"], "date": check_date})
            if has:
                streak += 1
            else:
                if d > 0: break

        leaderboard.append({
            "name": m["name"],
            "user_id": m["user_id"],
            "is_me": m["user_id"] == user['id'],
            "checkins": checkins,
            "tasks_done": total_tasks,
            "streak": streak,
            "score": checkins * 10 + total_tasks * 5 + streak * 15,
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    for i, m in enumerate(leaderboard):
        m["rank"] = i + 1

    return {"leaderboard": leaderboard, "team_id": team["id"], "invite_code": team["invite_code"]}
async def program_checkin(data: dict, user=Depends(get_current_user)):
    """Submit daily check-in for active program"""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Aucun programme actif")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Merge with auto-saved task progress (using indices)
    saved_progress = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )
    submitted_indices = data.get("tasks_done_indices", [])
    if saved_progress:
        saved_indices = saved_progress.get("tasks_done_indices", [])
        merged_indices = list(set(submitted_indices + saved_indices))
    else:
        merged_indices = submitted_indices

    # Check if already checked in today
    existing = await db.program_checkins.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}
    )
    if existing:
        # Update existing
        await db.program_checkins.update_one(
            {"enrollment_id": enrollment["id"], "date": today_str},
            {"$set": {"mood": data.get("mood", 3), "note": data.get("note", ""), "tasks_done_indices": merged_indices, "sleep_quality": data.get("sleep_quality"), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": "updated"}

    checkin = {
        "id": str(uuid.uuid4()),
        "enrollment_id": enrollment["id"],
        "user_id": user['id'],
        "date": today_str,
        "day": enrollment.get("current_day", 1),
        "mood": data.get("mood", 3),
        "note": data.get("note", ""),
        "tasks_done_indices": merged_indices,
        "sleep_quality": data.get("sleep_quality"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.program_checkins.insert_one(checkin)

    # Update streak
    await db.program_enrollments.update_one(
        {"id": enrollment["id"]},
        {"$addToSet": {"completed_days": today_str}, "$inc": {"streak": 1}}
    )

    # Generate AI feedback
    feedback = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
            prompt = f"""L'utilisateur fait son check-in du jour {enrollment.get('current_day', 1)} du programme "{program.get('title', '')}".
Humeur: {data.get('mood', 3)}/5. Note: {data.get('note', 'aucune')}. Taches completees: {data.get('tasks_done', [])}.
Genere UNE phrase factuelle et medicalement pertinente (max 20 mots). Vouvoyez le patient. Pas d'emoji. Pas d'encouragement excessif."""
            chat = LlmChat(api_key=api_key, session_id=f"fb-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. 1 phrase courte, professionnelle. Pas d'emoji.").with_model("openai", "gpt-5.2")
            feedback = (await chat.send_message(UserMessage(text=prompt))).strip()
        except Exception as e:
            print(f"Checkin AI error: {e}")

    if not feedback:
        feedback = "Votre regularite est un facteur cle pour l'efficacite du programme."

    return {"status": "created", "feedback": feedback}


@router.post("/programs/stop")
async def stop_program(user=Depends(get_current_user)):
    """Stop/abandon active program"""
    result = await db.program_enrollments.update_one(
        {"user_id": user['id'], "status": "active"},
        {"$set": {"status": "abandoned", "stopped_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Aucun programme actif")
    return {"status": "stopped"}


@router.get("/programs/completion-report/{enrollment_id}")
async def get_completion_report(enrollment_id: str, user=Depends(get_current_user)):
    """Generate a comprehensive before/after completion report with health data comparison"""
    enrollment = await db.program_enrollments.find_one(
        {"id": enrollment_id, "user_id": user['id']}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscription non trouvee")

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    # Get all checkins for this enrollment
    checkins = await db.program_checkins.find(
        {"enrollment_id": enrollment_id}, {"_id": 0}
    ).sort("date", 1).to_list(100)

    total_days = program.get("duration_days", 21)
    completed_days = len(checkins)
    moods = [c.get("mood", 3) for c in checkins if c.get("mood")]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    best_mood = max(moods) if moods else 0
    streak = enrollment.get("streak", completed_days)

    # Mood evolution (first half vs second half)
    mid = len(moods) // 2
    first_half_mood = round(sum(moods[:mid]) / max(len(moods[:mid]), 1), 1) if moods else 0
    second_half_mood = round(sum(moods[mid:]) / max(len(moods[mid:]), 1), 1) if moods else 0

    # Before/After health data comparison
    snapshot_start = enrollment.get("health_snapshot_start", {})
    snapshot_end = await _capture_health_snapshot(user['id'])
    
    # Build health comparison
    tracked_metrics = program.get("tracked_metrics", [])
    health_comparison = []
    metric_labels = {
        "sleep_quality": {"label": "Qualite du sommeil", "unit": "%", "better": "higher"},
        "sleep_duration_min": {"label": "Duree du sommeil", "unit": "min", "better": "higher"},
        "deep_sleep_min": {"label": "Sommeil profond", "unit": "min", "better": "higher"},
        "heart_rate": {"label": "Frequence cardiaque", "unit": "bpm", "better": "lower"},
        "hrv": {"label": "Variabilite cardiaque", "unit": "ms", "better": "higher"},
        "stress_level": {"label": "Niveau de stress", "unit": "/100", "better": "lower"},
        "steps": {"label": "Pas quotidiens", "unit": "pas", "better": "higher"},
        "calories": {"label": "Calories", "unit": "kcal", "better": "higher"},
        "weight": {"label": "Poids", "unit": "kg", "better": "lower"},
        "body_fat_pct": {"label": "Masse grasse", "unit": "%", "better": "lower"},
        "muscle_pct": {"label": "Masse musculaire", "unit": "%", "better": "higher"},
        "blood_pressure": {"label": "Tension", "unit": "mmHg", "better": "lower"},
        "recovery_score": {"label": "Recuperation", "unit": "/100", "better": "higher"},
    }
    for mk in tracked_metrics:
        meta = metric_labels.get(mk, {"label": mk, "unit": "", "better": "higher"})
        before_val = snapshot_start.get(mk)
        after_val = snapshot_end.get(mk)
        if before_val is not None and after_val is not None:
            if isinstance(before_val, dict):
                continue  # Skip complex types like blood_pressure for now
            diff = round(after_val - before_val, 1)
            improved = (diff > 0 and meta["better"] == "higher") or (diff < 0 and meta["better"] == "lower")
            health_comparison.append({
                "metric": mk, "label": meta["label"], "unit": meta["unit"],
                "before": before_val, "after": after_val,
                "diff": diff, "improved": improved,
            })

    # Generate AI completion report
    ai_report = None
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json
            prompt = f"""L'utilisateur a termine le programme "{program.get('title', '')}".
Stats: {completed_days}/{total_days} jours completes, humeur moyenne {avg_mood}/5 (debut {first_half_mood}/5 -> fin {second_half_mood}/5), meilleur streak {streak} jours.
Notes des check-ins: {'; '.join(c.get('note', '') for c in checkins[-5:] if c.get('note'))}.
Genere un bilan medical de fin de programme en JSON. Ton professionnel, pas d'emoji, vouvoyez le patient:
{{"title": "titre sobre et factuel", "summary": "3-4 phrases de bilan medical objectif avec les resultats mesurables", "achievements": ["resultat 1", "resultat 2", "resultat 3"], "before_after": {{"mood": {{"before": {first_half_mood}, "after": {second_half_mood}}}, "regularity": {{"before": "debut", "after": "{completed_days} jours"}}}}, "next_steps": ["recommandation medicale 1", "recommandation 2"], "celebration": "phrase de conclusion professionnelle"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"cr-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. JSON uniquement. Pas d'emoji. Ton medical professionnel.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            ai_report = json.loads(r.strip())
        except Exception as e:
            print(f"Completion report AI err: {e}")

    if not ai_report:
        ai_report = {
            "title": "Programme termine !",
            "summary": f"Tu as complete {completed_days} jours sur {total_days}. Ta regularite est impressionnante !",
            "achievements": ["Programme suivi avec regularite", f"Humeur moyenne de {avg_mood}/5", f"Streak de {streak} jours"],
            "before_after": {"mood": {"before": first_half_mood, "after": second_half_mood}, "regularity": {"before": "debut", "after": f"{completed_days} jours"}},
            "next_steps": ["Continue tes bonnes habitudes", "Lance un nouveau programme"],
            "celebration": "Programme termine. Les habitudes acquises constituent une base solide pour votre sante.",
        }

    return {
        "enrollment": enrollment,
        "program": {"id": program["id"], "title": program["title"], "icon": program["icon"], "color": program["color"], "duration_days": total_days},
        "stats": {
            "completed_days": completed_days, "total_days": total_days,
            "completion_pct": round((completed_days / total_days) * 100),
            "avg_mood": avg_mood, "best_mood": best_mood, "streak": streak,
            "first_half_mood": first_half_mood, "second_half_mood": second_half_mood,
        },
        "report": ai_report,
        "health_comparison": health_comparison,
        "checkins": checkins,
    }



BADGE_DEFS = [
    {"id": "streak-3", "title": "3 jours", "icon": "ri-fire-line", "color": "#F59E0B", "condition": "streak >= 3", "description": "3 jours consecutifs"},
    {"id": "streak-7", "title": "1 semaine", "icon": "ri-fire-fill", "color": "#EF4444", "condition": "streak >= 7", "description": "7 jours consecutifs"},
    {"id": "streak-14", "title": "2 semaines", "icon": "ri-medal-line", "color": "#A78BFA", "condition": "streak >= 14", "description": "14 jours consecutifs"},
    {"id": "streak-21", "title": "Programme complet", "icon": "ri-trophy-line", "color": "#22D3EE", "condition": "streak >= 21", "description": "Programme termine !"},
    {"id": "first-checkin", "title": "Premier pas", "icon": "ri-footprint-line", "color": "#10B981", "condition": "total_checkins >= 1", "description": "Premier check-in"},
    {"id": "mood-5", "title": "Jour parfait", "icon": "ri-emotion-happy-line", "color": "#F59E0B", "condition": "had_mood_5", "description": "Humeur 5/5 atteinte"},
]


@router.get("/programs/badges")
async def get_badges(user=Depends(get_current_user)):
    """Get earned badges"""
    uid = user['id']
    checkins = await db.program_checkins.find({"user_id": uid}, {"_id": 0}).to_list(500)
    enrollments = await db.program_enrollments.find({"user_id": uid}, {"_id": 0}).to_list(50)

    total_checkins = len(checkins)
    max_streak = max((e.get("streak", 0) for e in enrollments), default=0)
    had_mood_5 = any(c.get("mood") == 5 for c in checkins)
    completed = any(e.get("status") == "completed" for e in enrollments)

    earned = []
    for b in BADGE_DEFS:
        cond = b["condition"]
        unlocked = False
        if "streak >= 21" in cond: unlocked = max_streak >= 21 or completed
        elif "streak >= 14" in cond: unlocked = max_streak >= 14
        elif "streak >= 7" in cond: unlocked = max_streak >= 7
        elif "streak >= 3" in cond: unlocked = max_streak >= 3
        elif "total_checkins >= 1" in cond: unlocked = total_checkins >= 1
        elif "had_mood_5" in cond: unlocked = had_mood_5
        earned.append({**{k: v for k, v in b.items() if k != "condition"}, "unlocked": unlocked})

    return {"badges": earned, "stats": {"total_checkins": total_checkins, "max_streak": max_streak, "programs_completed": sum(1 for e in enrollments if e.get("status") == "completed")}}


@router.get("/programs/weekly-report")
async def get_weekly_report(user=Depends(get_current_user)):
    """Generate AI-powered weekly health report"""
    uid = user['id']
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    # Get this week's and last week's check-ins
    this_week = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)
    last_week = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": two_weeks_ago.isoformat(), "$lt": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)

    # Stats
    this_moods = [c.get("mood", 3) for c in this_week if c.get("mood")]
    last_moods = [c.get("mood", 3) for c in last_week if c.get("mood")]
    avg_mood_this = round(sum(this_moods) / len(this_moods), 1) if this_moods else 0
    avg_mood_last = round(sum(last_moods) / len(last_moods), 1) if last_moods else 0
    checkins_this = len(this_week)
    checkins_last = len(last_week)

    # Active program info
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_info = ""
    if enrollment:
        program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
        if program:
            program_info = f"Programme actif: {program['title']}, jour {enrollment.get('current_day', 1)}/{program['duration_days']}."

    # Health summary
    summary = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})
    health_info = f"Score sante: {summary.get('score', '?')}/100." if summary else ""

    # Generate AI report
    ai_report = None
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            prompt = f"""Genere un bilan hebdomadaire de sante en JSON. Ton medical, professionnel, pas d'emoji. Vouvoyez.
Donnees: {checkins_this} check-ins cette semaine (vs {checkins_last} la semaine derniere). Humeur moyenne: {avg_mood_this}/5 (vs {avg_mood_last}/5). {program_info} {health_info}
JSON: {{"title": "titre factuel du bilan", "summary": "2-3 phrases d'analyse medicale objective", "wins": ["point positif mesurable 1", "point positif 2"], "improvements": ["axe d'amelioration medical"], "next_week_goal": "objectif concret et mesurable pour la semaine prochaine", "motivation": "rappel professionnel sobre"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"wr-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. JSON uniquement. Pas d'emoji. Vouvoyez.").with_model("openai", "gpt-5.2")
            import json
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            ai_report = json.loads(r.strip())
        except Exception as e:
            print(f"Weekly report AI err: {e}")

    if not ai_report:
        ai_report = {
            "title": "Bilan de la semaine",
            "summary": f"Tu as fait {checkins_this} check-ins cette semaine. Continue comme ca !",
            "wins": ["Tu es regulier dans tes check-ins"],
            "improvements": ["Essaie de maintenir une humeur positive"],
            "next_week_goal": "Faire au moins 5 check-ins la semaine prochaine",
            "motivation": "Chaque jour compte !",
        }

    return {
        "report": ai_report,
        "stats": {
            "checkins_this_week": checkins_this,
            "checkins_last_week": checkins_last,
            "avg_mood_this_week": avg_mood_this,
            "avg_mood_last_week": avg_mood_last,
            "mood_trend": "up" if avg_mood_this > avg_mood_last else "down" if avg_mood_this < avg_mood_last else "stable",
        },
        "generated_at": now.isoformat(),
    }


# ═══════════════════════════════════════
#  PARTAGE BILAN + PROGRAMMES EN EQUIPE
# ═══════════════════════════════════════

@router.post("/programs/share-report")
async def share_weekly_report(user=Depends(get_current_user)):
    """Generate a shareable link for weekly health report"""
    uid = user['id']
    share_id = uuid.uuid4().hex[:12]
    # Get fresh weekly report data
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    checkins = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)
    moods = [c.get("mood", 3) for c in checkins if c.get("mood")]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_title = ""
    if enrollment:
        prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
        if prog: program_title = prog.get("title", "")
    summary = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})

    share_doc = {
        "id": share_id, "user_id": uid, "user_name": user.get("name", "Utilisateur"),
        "created_at": now.isoformat(), "expires_at": (now + timedelta(days=7)).isoformat(),
        "data": {
            "score": summary.get("score") if summary else None,
            "status": summary.get("status") if summary else None,
            "checkins_count": len(checkins), "avg_mood": avg_mood,
            "program_title": program_title,
            "current_day": enrollment.get("current_day") if enrollment else None,
        }
    }
    await db.shared_reports.insert_one(share_doc)
    return {"share_id": share_id, "share_url": f"/shared-report/{share_id}"}


@router.get("/programs/shared-report/{share_id}")
async def get_shared_report(share_id: str):
    """Public endpoint - get shared report (no auth required)"""
    report = await db.shared_reports.find_one({"id": share_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Rapport non trouve ou expire")
    # Check expiry
    try:
        expires = datetime.fromisoformat(report["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=410, detail="Ce rapport a expire")
    except (KeyError, ValueError):
        pass
    return report


@router.post("/programs/team/create")
async def create_team_program(data: dict, user=Depends(get_current_user)):
    """Create a team program and get invite code"""
    if user.get("role") != "beneficiary" and user.get("active_role") != "beneficiary":
        raise HTTPException(status_code=403, detail="Seuls les beneficiaires peuvent creer un programme en equipe")

    program_id = data.get("program_id")
    start_date = data.get("start_date")  # ISO date string "2026-02-25"
    if not program_id or not start_date:
        raise HTTPException(status_code=400, detail="program_id et start_date requis")

    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    invite_code = uuid.uuid4().hex[:8].upper()
    team = {
        "id": str(uuid.uuid4()),
        "invite_code": invite_code,
        "program_id": program_id,
        "start_date": start_date,
        "created_by": user['id'],
        "members": [{"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}],
        "status": "waiting",  # waiting, active, completed
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.team_programs.insert_one(team)
    return {"team_id": team["id"], "invite_code": invite_code, "program": {"title": program["title"], "duration_days": program["duration_days"]}, "start_date": start_date}


@router.post("/programs/team/join")
async def join_team_program(data: dict, user=Depends(get_current_user)):
    """Join a team program with invite code"""
    if user.get("role") != "beneficiary" and user.get("active_role") != "beneficiary":
        raise HTTPException(status_code=403, detail="Seuls les beneficiaires peuvent rejoindre un programme en equipe")

    invite_code = data.get("invite_code", "").strip().upper()
    if not invite_code:
        raise HTTPException(status_code=400, detail="Code d'invitation requis")

    team = await db.team_programs.find_one({"invite_code": invite_code}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Code d'invitation invalide")
    if team.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Ce programme est deja termine")

    # Check if already member
    member_ids = [m["user_id"] for m in team.get("members", [])]
    if user['id'] in member_ids:
        raise HTTPException(status_code=400, detail="Tu fais deja partie de cette equipe")
    if len(member_ids) >= 5:
        raise HTTPException(status_code=400, detail="L'equipe est complete (5 max)")

    await db.team_programs.update_one(
        {"id": team["id"]},
        {"$push": {"members": {"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}}}
    )

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    creator = next((m for m in team["members"] if m["user_id"] == team["created_by"]), None)
    return {
        "status": "joined", "team_id": team["id"],
        "program": {"title": program["title"] if program else "Programme", "duration_days": program["duration_days"] if program else 0},
        "start_date": team["start_date"],
        "creator_name": creator["name"] if creator else "Quelqu'un",
        "members_count": len(member_ids) + 1,
    }


@router.get("/programs/team/active")
async def get_active_team(user=Depends(get_current_user)):
    """Get active team program with all members progress"""
    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    if not team:
        return {"has_team": False}

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})

    # Calculate day based on start_date
    try:
        start = datetime.fromisoformat(team["start_date"])
        days_since = (datetime.now(timezone.utc) - start).days + 1
        if days_since < 1:
            # Program hasn't started yet
            days_until = abs(days_since) + 1
            return {
                "has_team": True, "status": "waiting",
                "team_id": team["id"], "invite_code": team["invite_code"],
                "program": {"title": program["title"] if program else "", "icon": program.get("icon", ""), "color": program.get("color", "#A78BFA"), "duration_days": program.get("duration_days", 21)} if program else {},
                "start_date": team["start_date"], "days_until_start": days_until,
                "members": [{"name": m["name"], "user_id": m["user_id"]} for m in team.get("members", [])],
            }
        current_day = min(days_since, program["duration_days"] if program else 30)
    except:
        current_day = 1

    # Activate if still waiting
    if team.get("status") == "waiting":
        await db.team_programs.update_one({"id": team["id"]}, {"$set": {"status": "active"}})

    # Get each member's progress
    members_progress = []
    for m in team.get("members", []):
        # Count their checkins
        checkins = await db.program_checkins.find(
            {"user_id": m["user_id"]}, {"_id": 0}
        ).to_list(100)
        recent_moods = [c.get("mood", 3) for c in checkins[-7:] if c.get("mood")]
        members_progress.append({
            "name": m["name"], "user_id": m["user_id"],
            "checkins_count": len(checkins),
            "avg_mood": round(sum(recent_moods) / len(recent_moods), 1) if recent_moods else 0,
            "is_me": m["user_id"] == user['id'],
        })

    return {
        "has_team": True, "status": "active",
        "team_id": team["id"], "invite_code": team["invite_code"],
        "program": {"title": program["title"] if program else "", "icon": program.get("icon", ""), "color": program.get("color", "#A78BFA"), "duration_days": program.get("duration_days", 21)} if program else {},
        "start_date": team["start_date"], "current_day": current_day,
        "progress_pct": round((current_day / (program["duration_days"] if program else 21)) * 100),
        "members": members_progress,
    }



@router.post("/programs/team/invite-by-phone")
async def invite_to_team_by_phone(data: dict, user=Depends(get_current_user)):
    """Invite someone to a team program by phone number.
    If the phone belongs to an existing beneficiary → in-app notification.
    If not → send SMS invitation."""
    phone = data.get("phone", "").strip()
    team_id = data.get("team_id", "").strip()
    if not phone or not team_id:
        raise HTTPException(status_code=400, detail="phone et team_id requis")

    team = await db.team_programs.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Equipe non trouvee")
    if team.get("created_by") != user['id']:
        # Allow any member to invite
        member_ids = [m["user_id"] for m in team.get("members", [])]
        if user['id'] not in member_ids:
            raise HTTPException(status_code=403, detail="Vous ne faites pas partie de cette equipe")

    # Normalize phone
    cleaned = phone.replace("+", "").replace(" ", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "33" + cleaned[1:]
    if not cleaned.startswith("33"):
        cleaned = "33" + cleaned

    # Check if phone belongs to an existing beneficiary
    phone_variants = [f"+{cleaned}", cleaned, f"0{cleaned[2:]}" if cleaned.startswith("33") else cleaned]
    existing_user = None
    for pv in phone_variants:
        existing_user = await db.users.find_one({"phone": pv, "role": "beneficiary"}, {"_id": 0})
        if existing_user:
            break

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    program_title = program.get("title", "Programme") if program else "Programme"

    if existing_user:
        # Check if already a member
        member_ids = [m["user_id"] for m in team.get("members", [])]
        if existing_user['id'] in member_ids:
            return {"status": "already_member", "message": f"{existing_user.get('name', 'Cet utilisateur')} fait deja partie de l'equipe."}

        # Create in-app notification
        invite_id = str(uuid.uuid4())
        await db.team_invitations.insert_one({
            "id": invite_id,
            "team_id": team_id,
            "invite_code": team["invite_code"],
            "inviter_id": user['id'],
            "inviter_name": user.get("name", ""),
            "invitee_id": existing_user['id'],
            "invitee_phone": phone,
            "program_id": team["program_id"],
            "program_title": program_title,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {
            "status": "notification_sent",
            "method": "in_app",
            "message": f"Invitation envoyee a {existing_user.get('name', 'l utilisateur')}. Il/elle recevra une notification dans l'application.",
            "invitee_name": existing_user.get("name", ""),
        }
    else:
        # Send SMS
        from services.smsmode_service import send_sms
        sms_text = f"{user.get('name', 'Un ami')} vous invite a faire le programme '{program_title}' ensemble sur Chutex. Code equipe: {team['invite_code']}. Telechargez l'app Chutex pour rejoindre."
        sms_sent = await send_sms(cleaned, sms_text)
        return {
            "status": "sms_sent" if sms_sent else "sms_failed",
            "method": "sms",
            "message": f"SMS d'invitation envoye au {phone}." if sms_sent else "Impossible d'envoyer le SMS. Partagez le code manuellement.",
            "invite_code": team["invite_code"],
        }


@router.get("/programs/team/invitations")
async def get_team_invitations(user=Depends(get_current_user)):
    """Get pending team program invitations for the current user"""
    invitations = await db.team_invitations.find(
        {"invitee_id": user['id'], "status": "pending"}, {"_id": 0}
    ).to_list(20)
    return invitations


@router.post("/programs/team/invitations/{invite_id}/accept")
async def accept_team_invitation(invite_id: str, user=Depends(get_current_user)):
    """Accept a team program invitation"""
    invite = await db.team_invitations.find_one({"id": invite_id, "invitee_id": user['id']}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation non trouvee")

    team = await db.team_programs.find_one({"id": invite["team_id"]}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Equipe non trouvee")

    # Add user to team
    member_ids = [m["user_id"] for m in team.get("members", [])]
    if user['id'] not in member_ids:
        await db.team_programs.update_one(
            {"id": team["id"]},
            {"$push": {"members": {"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}}}
        )

    # Mark invitation as accepted
    await db.team_invitations.update_one({"id": invite_id}, {"$set": {"status": "accepted"}})

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    return {
        "status": "joined",
        "team_id": team["id"],
        "invite_code": team["invite_code"],
        "program_title": program.get("title", "") if program else "",
    }


@router.post("/programs/team/invitations/{invite_id}/reject")
async def reject_team_invitation(invite_id: str, user=Depends(get_current_user)):
    """Reject a team program invitation"""
    await db.team_invitations.update_one(
        {"id": invite_id, "invitee_id": user['id']},
        {"$set": {"status": "rejected"}}
    )
    return {"status": "rejected"}
