from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os, uuid

from database import db
from auth import get_current_user

router = APIRouter()

# ─── Seed programs on import ───
SEED_PROGRAMS = [
    {
        "id": "prog-sleep-21",
        "title": "21 jours pour mieux dormir",
        "subtitle": "Ameliorez votre sommeil en 3 semaines",
        "icon": "ri-moon-line",
        "color": "#A78BFA",
        "duration_days": 21,
        "category": "sommeil",
        "difficulty": "facile",
        "description": "Un programme progressif en 3 phases pour transformer vos nuits. Semaine 1 : installer les bonnes habitudes. Semaine 2 : optimiser votre environnement. Semaine 3 : consolider et personnaliser.",
        "phases": [
            {"name": "Habitudes", "days": [1, 7], "description": "Mettre en place les rituels du soir"},
            {"name": "Environnement", "days": [8, 14], "description": "Optimiser votre chambre et vos conditions de sommeil"},
            {"name": "Consolidation", "days": [15, 21], "description": "Personnaliser et ancrer les acquis"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Fixer une heure de coucher reguliere", "tasks": ["Choisis ton heure de coucher ideale", "Mets un rappel 30min avant", "Note l'heure a laquelle tu t'es couche"], "tip": "La regularite est la cle n°1 du bon sommeil."},
            "2": {"focus": "Eliminer les ecrans le soir", "tasks": ["Pas d'ecran 1h avant le coucher", "Remplace par de la lecture ou musique douce", "Note comment tu te sens"], "tip": "La lumiere bleue bloque la melatonine."},
            "3": {"focus": "Creer un rituel du soir", "tasks": ["Tisane ou eau tiede 1h avant", "5 minutes de respiration profonde", "Prepare tes affaires pour demain"], "tip": "Le cerveau aime les routines pour s'endormir."},
            "4": {"focus": "Reduire la cafeine", "tasks": ["Pas de cafe apres 14h", "Remplace par du the vert ou de l'eau", "Observe l'impact sur ton endormissement"], "tip": "La cafeine reste active 6-8h dans le corps."},
            "5": {"focus": "Bouger en journee", "tasks": ["30 minutes de marche aujourd'hui", "Pas de sport intense apres 18h", "Etirements doux le soir"], "tip": "L'activite physique ameliore la qualite du sommeil profond."},
            "6": {"focus": "Gerer le stress du soir", "tasks": ["Ecris 3 choses positives de ta journee", "5 min de coherence cardiaque", "Evite les sujets stressants apres 20h"], "tip": "Le stress est l'ennemi n°1 de l'endormissement."},
            "7": {"focus": "Bilan de la semaine 1", "tasks": ["Compare ton sommeil jour 1 vs aujourd'hui", "Note ce qui a le mieux marche", "Felicite-toi pour cette premiere semaine !"], "tip": "Tu as deja pose les fondations."},
            "8": {"focus": "Temperature de la chambre", "tasks": ["Regle ta chambre a 18-19°C", "Aere 10 min avant de dormir", "Utilise une couette adaptee"], "tip": "Le corps a besoin de se refroidir pour s'endormir."},
            "9": {"focus": "Obscurite totale", "tasks": ["Installe des rideaux occultants", "Cache les veilleuses et LEDs", "Teste un masque de sommeil"], "tip": "Meme une petite lumiere perturbe la melatonine."},
            "10": {"focus": "Reduire le bruit", "tasks": ["Identifie les sources de bruit", "Teste des bouchons d'oreilles", "Essaie un bruit blanc ou bruit de pluie"], "tip": "Le silence ou un bruit constant favorise le sommeil profond."},
            "11": {"focus": "Literie et confort", "tasks": ["Verifie l'age de ton matelas", "Teste une position differente", "Assure-toi que ton oreiller soutient ta nuque"], "tip": "Un bon matelas change tout."},
            "12": {"focus": "Alimentation du soir", "tasks": ["Dine leger 2-3h avant le coucher", "Evite l'alcool ce soir", "Privilegiee les aliments riches en tryptophane"], "tip": "Banane, noix, lait tiede : des allies sommeil."},
            "13": {"focus": "Deconnexion mentale", "tasks": ["Ecris tes pensees dans un carnet", "Pratique le body scan (relaxation progressive)", "Visualise un lieu paisible"], "tip": "Vider l'esprit avant de dormir."},
            "14": {"focus": "Bilan de la semaine 2", "tasks": ["Compare semaine 1 et semaine 2", "Note les ameliorations de ton environnement", "Prepare-toi pour la phase finale !"], "tip": "Ton environnement est maintenant optimise."},
            "15": {"focus": "Personnaliser ton rituel", "tasks": ["Combine les 3 meilleures habitudes des 2 semaines", "Cree TON rituel personnalise", "Chronometre-le (ideal: 20-30 min)"], "tip": "Le meilleur rituel est celui qui TE convient."},
            "16": {"focus": "Siestes strategiques", "tasks": ["Si fatigue : sieste de 20min max avant 15h", "Pas de sieste longue", "Note ton energie de l'apres-midi"], "tip": "Une micro-sieste boost sans impacter la nuit."},
            "17": {"focus": "Exposition a la lumiere", "tasks": ["15 min de lumiere naturelle le matin", "Evite les lunettes de soleil tot le matin", "Baisse les lumieres progressivement le soir"], "tip": "La lumiere du matin recale ton horloge biologique."},
            "18": {"focus": "Gestion des reveils nocturnes", "tasks": ["Si reveil : pas de telephone", "Respiration 4-7-8 (inspire 4s, retiens 7s, expire 8s)", "Si 20min sans dormir : leve-toi, lis, puis recouche-toi"], "tip": "Ne force jamais le sommeil."},
            "19": {"focus": "Reguler le week-end", "tasks": ["Meme heure de coucher ce week-end", "Maximum 1h de grasse matinee", "Maintiens ton rituel"], "tip": "Le jet-lag social detruit tes progres en semaine."},
            "20": {"focus": "Preparer l'apres-programme", "tasks": ["Liste tes 5 habitudes cles a garder", "Planifie ta routine post-programme", "Fixe-toi un objectif sommeil pour le mois prochain"], "tip": "L'objectif est que ca devienne automatique."},
            "21": {"focus": "Celebration et bilan final !", "tasks": ["Compare tes donnees jour 1 vs jour 21", "Felicite-toi : 21 jours de discipline !", "Partage tes resultats avec ton gardien"], "tip": "Tu as cree de nouvelles habitudes durables. Bravo !"},
        },
    },
    {
        "id": "prog-tension-14",
        "title": "14 jours pour stabiliser sa tension",
        "subtitle": "Prenez le controle de votre tension arterielle",
        "icon": "ri-heart-pulse-line",
        "color": "#EF4444",
        "duration_days": 14,
        "category": "cardiovasculaire",
        "difficulty": "moyen",
        "description": "Un programme de 2 semaines pour comprendre et ameliorer votre tension arterielle par l'alimentation, l'activite et la gestion du stress.",
        "phases": [
            {"name": "Comprendre", "days": [1, 7], "description": "Mesurer, comprendre et ajuster l'alimentation"},
            {"name": "Agir", "days": [8, 14], "description": "Activite physique adaptee et gestion du stress"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Comprendre ta tension", "tasks": ["Mesure ta tension matin et soir", "Note les valeurs dans l'app", "Lis la fiche 'Qu est-ce que la tension ?'"], "tip": "La tension normale est en dessous de 140/90 mmHg."},
            "2": {"focus": "Reduire le sel", "tasks": ["Pas de sel ajoute aujourd'hui", "Evite les plats prepares et charcuterie", "Decouvre les epices comme alternative"], "tip": "Le sel est le facteur n1 de l'hypertension."},
            "3": {"focus": "Augmenter le potassium", "tasks": ["Mange une banane ou des epinards", "Ajoute des lentilles a un repas", "Bois un verre de jus d'orange frais"], "tip": "Le potassium contrebalance l'effet du sodium."},
            "4": {"focus": "Hydratation et tension", "tasks": ["Bois 1.5L d'eau aujourd'hui", "Remplace un cafe par une tisane", "Note ta consommation d'eau"], "tip": "La deshydratation augmente la tension."},
            "5": {"focus": "Alcool et tension", "tasks": ["Pas d'alcool aujourd'hui", "Remplace par de l'eau gazeuse ou un mocktail", "Observe l'impact sur ta tension du soir"], "tip": "L'alcool augmente la tension de 5-10 mmHg."},
            "6": {"focus": "Alimentation DASH", "tasks": ["Mange 5 portions de fruits et legumes", "Choisis des cereales completes", "Reduis les graisses saturees"], "tip": "Le regime DASH reduit la tension de 8-14 mmHg."},
            "7": {"focus": "Bilan semaine 1", "tasks": ["Compare tes tensions jour 1 vs jour 7", "Note les changements alimentaires reussis", "Prepare-toi pour la phase Agir !"], "tip": "L'alimentation agit en 1-2 semaines sur la tension."},
            "8": {"focus": "Marche quotidienne", "tasks": ["30 minutes de marche a rythme modere", "Pas d'essoufflement excessif", "Mesure ta tension avant et apres"], "tip": "L'exercice regulier baisse la tension de 5-8 mmHg."},
            "9": {"focus": "Respiration et tension", "tasks": ["5 minutes de coherence cardiaque matin", "5 minutes de respiration profonde soir", "Telecharge une app de respiration guidee"], "tip": "La respiration lente active le systeme parasympathique."},
            "10": {"focus": "Gestion du stress", "tasks": ["Identifie tes 3 sources de stress principales", "Pratique 10 min de relaxation", "Ecris dans un journal de gratitude"], "tip": "Le stress chronique maintient la tension elevee."},
            "11": {"focus": "Sommeil et tension", "tasks": ["Couche-toi avant 23h", "Pas d'ecran 1h avant", "Mesure ta tension au reveil"], "tip": "Un mauvais sommeil augmente la tension de 10%."},
            "12": {"focus": "Activite douce", "tasks": ["20 min de yoga ou tai-chi", "Etirements du matin (10 min)", "Marche apres le dejeuner"], "tip": "Les activites douces baissent le cortisol."},
            "13": {"focus": "Poids et tension", "tasks": ["Pese-toi ce matin", "Note ton IMC", "Fixe un objectif realiste si besoin"], "tip": "Perdre 5kg peut baisser la tension de 5 mmHg."},
            "14": {"focus": "Bilan final !", "tasks": ["Compare toutes tes tensions jour 1 vs jour 14", "Liste tes 5 meilleures habitudes", "Planifie comment les maintenir"], "tip": "Bravo ! Tu as les cles pour controler ta tension."},
        },
    },
    {
        "id": "prog-activity-30",
        "title": "30 jours pour bouger plus",
        "subtitle": "Retrouvez le plaisir de l'activite physique",
        "icon": "ri-footprint-line",
        "color": "#10B981",
        "duration_days": 30,
        "category": "activite",
        "difficulty": "progressif",
        "description": "Un mois pour integrer l'activite physique a votre quotidien, a votre rythme. Pas de performance, juste du mouvement et du bien-etre.",
        "phases": [
            {"name": "Decouverte", "days": [1, 10], "description": "Reprendre doucement avec la marche"},
            {"name": "Progression", "days": [11, 20], "description": "Augmenter et varier les activites"},
            {"name": "Autonomie", "days": [21, 30], "description": "Trouver votre routine personnelle"},
        ],
        "daily_tasks_template": {
            "1": {"focus": "Premier pas", "tasks": ["15 minutes de marche tranquille", "Choisis un parcours agreable", "Note comment tu te sens apres"], "tip": "Le plus dur c'est de commencer. Tu l'as fait !"},
            "2": {"focus": "Decouvrir son rythme", "tasks": ["20 minutes de marche", "Trouve ton rythme confortable", "Respire par le nez"], "tip": "Pas besoin d'aller vite, l'important c'est de bouger."},
            "3": {"focus": "Explorer son quartier", "tasks": ["25 minutes de marche", "Decouvre un nouveau chemin", "Observe la nature autour de toi"], "tip": "Varier les parcours rend la marche plus agreable."},
            "4": {"focus": "Etirements matinaux", "tasks": ["10 min d'etirements au reveil", "15 min de marche", "Etire le dos, les jambes, les epaules"], "tip": "S'etirer le matin reveille le corps en douceur."},
            "5": {"focus": "Marche et respiration", "tasks": ["25 min de marche", "Pratique la marche consciente (attention aux sensations)", "3 pauses respiration profonde"], "tip": "La marche consciente reduit le stress de 40%."},
            "6": {"focus": "Montees et descentes", "tasks": ["Prends les escaliers aujourd'hui", "20 min de marche avec un leger denivelé", "Note tes sensations"], "tip": "Les escaliers renforcent le coeur et les jambes."},
            "7": {"focus": "Jour de repos actif", "tasks": ["Etirements doux (15 min)", "Pas de marche obligatoire", "Hydrate-toi bien"], "tip": "Le repos fait partie de l'entrainement."},
            "8": {"focus": "Augmenter la duree", "tasks": ["30 minutes de marche", "Maintiens un rythme regulier", "Ecoute de la musique ou un podcast"], "tip": "30 min c'est le seuil recommande par l'OMS."},
            "9": {"focus": "Marche sociale", "tasks": ["Invite quelqu'un a marcher avec toi", "30 min de marche a deux", "Partage tes progres"], "tip": "Marcher a deux motive et rend l'effort plus leger."},
            "10": {"focus": "Bilan phase 1", "tasks": ["Compare ton endurance jour 1 vs aujourd'hui", "Celebre tes 10 jours !", "Fixe un objectif pour la phase 2"], "tip": "10 jours, tu as deja cree une habitude."},
            "11": {"focus": "Varier le mouvement", "tasks": ["20 min de marche + 10 min de gymnastique douce", "Essaie des mouvements de bras pendant la marche", "Note les exercices que tu preferes"], "tip": "La variete evite la monotonie et travaille tout le corps."},
            "12": {"focus": "Equilibre et coordination", "tasks": ["Exercices d'equilibre (tenir sur un pied 30s)", "Marche talon-pointe sur 20 metres", "25 min de marche"], "tip": "L'equilibre previent les chutes."},
            "13": {"focus": "Renforcement doux", "tasks": ["10 squats assis-debout (avec chaise)", "10 montees sur pointes de pieds", "25 min de marche"], "tip": "Le renforcement preserve la masse musculaire."},
            "14": {"focus": "Marche rapide", "tasks": ["30 min de marche avec 5 min a rythme rapide", "Alterne lent/rapide toutes les 5 min", "Note ta frequence cardiaque"], "tip": "L'interval training est excellent pour le coeur."},
            "15": {"focus": "Souplesse", "tasks": ["15 min d'etirements complets", "Yoga doux ou tai-chi (10 min)", "20 min de marche"], "tip": "La souplesse ameliore la mobilite au quotidien."},
            "16": {"focus": "Activite en musique", "tasks": ["Cree une playlist motivante", "30 min de marche en musique", "Essaie de caler ton rythme sur la musique"], "tip": "La musique augmente l'endurance de 15%."},
            "17": {"focus": "Force du haut du corps", "tasks": ["Pompes contre le mur (10 rep)", "Exercices avec bouteilles d'eau (10 rep)", "25 min de marche"], "tip": "Les bras et le dos ont aussi besoin d'attention."},
            "18": {"focus": "Marche longue", "tasks": ["40 min de marche a ton rythme", "Explore un parc ou un sentier", "Emporte de l'eau"], "tip": "Les marches longues brulent plus de graisses."},
            "19": {"focus": "Respiration et effort", "tasks": ["Coherence cardiaque avant l'effort (5 min)", "30 min de marche", "Etirements apres (10 min)"], "tip": "Bien respirer optimise chaque mouvement."},
            "20": {"focus": "Bilan phase 2", "tasks": ["Compare tes capacites phase 1 vs phase 2", "Note tes exercices preferes", "Tu es a 2/3 du programme !"], "tip": "Tu as double tes capacites en 20 jours."},
            "21": {"focus": "Creer ta routine", "tasks": ["Choisis 3 exercices preferes", "Planifie ta semaine d'activite", "30 min de marche + tes exercices"], "tip": "La meilleure routine est celle que tu fais avec plaisir."},
            "22": {"focus": "Defier ses limites", "tasks": ["Ajoute 5 min a ta marche habituelle", "Essaie un nouvel exercice", "Note ton ressenti"], "tip": "Sortir de sa zone de confort fait progresser."},
            "23": {"focus": "Activite en nature", "tasks": ["Marche en foret ou dans un parc (35 min)", "Observe la nature en marchant", "Respire profondement l'air frais"], "tip": "La nature reduit le cortisol de 20%."},
            "24": {"focus": "Circuit maison", "tasks": ["10 squats + 10 montees genoux + 10 talons-fesses", "Repete 3 fois avec pause", "20 min de marche"], "tip": "Un circuit de 15 min vaut 30 min de marche."},
            "25": {"focus": "Marche meditative", "tasks": ["30 min de marche lente et consciente", "Concentre-toi sur chaque pas", "Pas de musique, juste le silence"], "tip": "La marche meditative calme le mental."},
            "26": {"focus": "Journee active", "tasks": ["Prends les escaliers toute la journee", "Fais une course a pied", "Marche apres chaque repas (10 min)"], "tip": "L'activite fractionnee compte aussi."},
            "27": {"focus": "Sport doux", "tasks": ["Essaie le yoga, la natation ou le velo", "30 min d'activite au choix", "Note ce que tu as prefere"], "tip": "Varier les activites travaille differents muscles."},
            "28": {"focus": "Ta meilleure performance", "tasks": ["40 min de marche a bon rythme", "Bats ton record de pas", "Celebre ta progression !"], "tip": "Compare avec le jour 1 : la difference est enorme."},
            "29": {"focus": "Planifier l'apres-programme", "tasks": ["Ecris ta routine hebdo ideale", "Fixe 3 objectifs pour le mois prochain", "Identifie les obstacles potentiels"], "tip": "La planification est la cle de la constance."},
            "30": {"focus": "Celebration finale !", "tasks": ["Compare jour 1 vs jour 30", "Partage tes resultats avec tes proches", "Felicite-toi : 30 jours de mouvement !"], "tip": "Tu as prouve que tu peux. Maintenant, ne t'arrete plus !"},
        },
    },
]


@router.on_event("startup")
async def seed_programs():
    for p in SEED_PROGRAMS:
        existing = await db.programs.find_one({"id": p["id"]})
        if not existing:
            await db.programs.insert_one(p)


@router.get("/programs/catalog")
async def get_program_catalog(user=Depends(get_current_user)):
    """Get available programs"""
    programs = await db.programs.find({}, {"_id": 0, "daily_tasks_template": 0}).to_list(20)
    # Check if user has active enrollment
    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    return {"programs": programs, "active_enrollment": active}


@router.post("/programs/start/{program_id}")
async def start_program(program_id: str, user=Depends(get_current_user)):
    """Start a program"""
    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    # Check no active program
    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}
    )
    if active:
        raise HTTPException(status_code=400, detail="Vous avez deja un programme actif. Terminez-le d'abord.")

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
    }
    await db.program_enrollments.insert_one(enrollment)
    enrollment.pop("_id", None)
    return {"status": "started", "enrollment": enrollment}


@router.get("/programs/active")
async def get_active_program(user=Depends(get_current_user)):
    """Get active program with today's tasks"""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"active": False}

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        return {"active": False}

    # Calculate current day based on start date
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

    # Get today's check-in if done
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
        "streak": streak,
        "progress_pct": round((current_day / program["duration_days"]) * 100),
        "started_at": enrollment["started_at"],
    }


@router.post("/programs/checkin")
async def program_checkin(data: dict, user=Depends(get_current_user)):
    """Submit daily check-in for active program"""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Aucun programme actif")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check if already checked in today
    existing = await db.program_checkins.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}
    )
    if existing:
        # Update existing
        await db.program_checkins.update_one(
            {"enrollment_id": enrollment["id"], "date": today_str},
            {"$set": {"mood": data.get("mood", 3), "note": data.get("note", ""), "tasks_done": data.get("tasks_done", []), "sleep_quality": data.get("sleep_quality"), "updated_at": datetime.now(timezone.utc).isoformat()}}
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
        "tasks_done": data.get("tasks_done", []),
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
Genere UNE phrase d'encouragement personnalisee et courte (max 20 mots). Tutoie l'utilisateur."""
            chat = LlmChat(api_key=api_key, session_id=f"fb-{uuid.uuid4().hex[:6]}",
                           system_message="Coach bienveillant. 1 phrase courte.").with_model("openai", "gpt-4.1-mini")
            feedback = (await chat.send_message(UserMessage(text=prompt))).strip()
        except Exception as e:
            print(f"Checkin AI error: {e}")

    if not feedback:
        feedback = "Bravo pour ta regularite ! Continue comme ca."

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
    """Generate a comprehensive before/after completion report"""
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
Genere un bilan de fin de programme en JSON:
{{"title": "titre celebratoire", "summary": "3-4 phrases de bilan personnalise avec les resultats concrets", "achievements": ["realisation 1", "realisation 2", "realisation 3"], "before_after": {{"mood": {{"before": {first_half_mood}, "after": {second_half_mood}}}, "regularity": {{"before": "debut", "after": "{completed_days} jours"}}}}, "next_steps": ["conseil 1 pour continuer", "conseil 2"], "celebration": "phrase de celebration motivante"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"cr-{uuid.uuid4().hex[:6]}",
                           system_message="Coach sante bienveillant. JSON uniquement.").with_model("openai", "gpt-4.1-mini")
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
            "celebration": "Bravo, tu as fait un travail remarquable !",
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
            prompt = f"""Genere un bilan hebdomadaire de sante en JSON.
Donnees: {checkins_this} check-ins cette semaine (vs {checkins_last} la semaine derniere). Humeur moyenne: {avg_mood_this}/5 (vs {avg_mood_last}/5). {program_info} {health_info}
JSON: {{"title": "titre court du bilan", "summary": "2-3 phrases de bilan personnalise", "wins": ["victoire 1", "victoire 2"], "improvements": ["point a ameliorer"], "next_week_goal": "objectif concret pour la semaine prochaine", "motivation": "phrase motivante courte"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"wr-{uuid.uuid4().hex[:6]}",
                           system_message="Coach sante. JSON uniquement. Tutoie l'utilisateur.").with_model("openai", "gpt-4.1-mini")
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

