# Program helper functions - extracted from program_routes.py

import re

def transform_task_text(text: str) -> str:
    """Transform task texts to reference in-app features instead of paper/external apps."""
    t = text
    # Paper/notebook references → app
    t = re.sub(r'(?i)sur (un |votre )?(papier|carnet|cahier|feuille)', "dans l'app (onglet Sante)", t)
    t = re.sub(r'(?i)[eéEÉ]crivez (vos |les |toutes )?(pens[eé]es|pr[eé]occupations|ruminations?)(.*?)dans un (carnet|journal)', r"Notez vos \2 dans l'app via le check-in du jour", t)
    t = re.sub(r'(?i)[eéEÉ]crivez (.*?)dans un (carnet|journal)', r"Notez \1 dans le check-in de l'app", t)
    # "notez l'heure réelle/de/du" → record in app
    t = re.sub(r"(?i)notez l['\u2019]heure (r[eé]elle |de |du |)", r"enregistrez l'heure dans l'app (onglet Sante) ", t)
    t = re.sub(r"(?i)(?<!\w)notez (votre |la |le |les |l['\u2019]|vos )", r"enregistrez dans l'app : ", t)
    t = re.sub(r"(?i)(?<!\w)notez ", r"enregistrez dans l'app : ", t)
    # "Programmez un rappel" → use app reminder
    t = re.sub(r"(?i)programmez un rappel (\d+) ?minutes?( avant)", r"activez un rappel dans l'app (onglet Rappels) \1 min\2", t)
    t = re.sub(r"(?i)programmez (une alarme|un rappel)", r"creez un rappel dans l'app (onglet Rappels)", t)
    t = re.sub(r"(?i)mettez (une |un )(alarme|rappel|minuteur)( sur votre t[eé]l[eé]phone| de votre t[eé]l[eé]phone)?", r"activez un rappel dans l'app (onglet Rappels)", t)
    # "ouvrez une app" references
    t = re.sub(r"(?i)(ouvrez|utilisez|t[eé]l[eé]char\w+) (une |l['\u2019])?(app|application|appli)\b[^.]*", r"utilisez la fonctionnalite dans l'app", t)
    t = re.sub(r"(?i)apps? de (flashcards?|m[eé]ditation|respiration|sport|fitness)", "exercices integres dans l'app", t)
    # Phone alarm references
    t = re.sub(r"(?i)(alarme|r[eé]veil|minuteur) (de |du |sur )(votre |le |son )?(t[eé]l[eé]phone|portable|smartphone)", r"rappel dans l'app", t)
    # "pesez-vous" → in-app weight tracking
    t = re.sub(r"(?i)pesez.vous et notez", r"pesez-vous et enregistrez dans l'app (onglet Sante > Poids)", t)
    # "mesurez votre tension" → in-app
    t = re.sub(r"(?i)mesurez (votre |la )?tension et notez", r"mesurez votre tension et enregistrez dans l'app (onglet Sante)", t)
    # "flashcards papier" and remaining paper references
    t = re.sub(r"(?i)des cartes papier\b[^.]*", r"le systeme de rappels de l'app", t)
    t = re.sub(r"(?i)lecture papier", "lecture", t)
    # Clean up double spaces and escaped quotes
    t = re.sub(r'  +', ' ', t)
    t = t.replace("\\'", "'")
    return t

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
