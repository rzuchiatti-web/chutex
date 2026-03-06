import asyncio, os, json, pymongo

EXAMPLE = '{"0": [{"instruction": "Placez-vous pres d\'un mur", "icon": "ri-shield-check-line"}, {"instruction": "Avez-vous reussi ?", "icon": "ri-check-line", "choices": ["Oui facilement", "Oui avec difficulte", "Non"], "validate": true}], "1": [{"instruction": "Etape 1", "icon": "ri-walk-line"}, {"instruction": "Resultat ?", "choices": ["Reussi", "Pas reussi"], "validate": true}], "2": [{"instruction": "Etape 1", "icon": "ri-edit-line"}, {"instruction": "Evaluation ?", "choices": ["Tres bien", "Bien", "Moyen", "Difficile"], "validate": true}]}'

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    client = pymongo.MongoClient('localhost', 27017)
    db = client['vitallink_db']
    total = 0
    
    for prog in db.programs.find({}, {'_id': 0}):
        pid = prog['id']
        dt = prog.get('daily_tasks_template', {})
        for day_key, day_data in dt.items():
            tasks = day_data.get('tasks', [])
            gs = day_data.get('guided_steps', {})
            needs_gen = any(not gs.get(str(i)) for i in range(len(tasks)))
            if not needs_gen:
                continue
            
            tasks_str = '\n'.join(f'{i}. {t}' for i, t in enumerate(tasks))
            prompt = f"""Genere des etapes guidees pour ces taches. UNIQUEMENT un objet JSON avec les cles "0", "1", "2" (index des taches).

Taches:
{tasks_str}

FORMAT EXACT (copie cette structure):
{EXAMPLE}

REGLES:
- Cles = index des taches: "0", "1", "2"
- Chaque valeur = liste d'etapes
- Chaque etape: instruction (string), icon (ri-xxx-line)
- Derniere etape de chaque tache: ajouter choices (liste de boutons) et validate: true
- 2-4 etapes par tache
- JSON BRUT, pas de markdown"""

            try:
                chat = LlmChat(api_key=api_key, session_id=f'gs3-{pid}-{day_key}',
                    system_message='Reponds UNIQUEMENT en JSON brut. Cles: "0", "1", "2".').with_model('openai', 'gpt-5.2')
                r = (await chat.send_message(UserMessage(text=prompt))).strip()
                if r.startswith('```'): r = r.split('\n', 1)[1] if '\n' in r else r[3:]
                if r.endswith('```'): r = r[:-3]
                guided = json.loads(r.strip())
                
                # Validate: must have keys "0", "1", etc.
                valid = all(str(i) in guided and isinstance(guided[str(i)], list) for i in range(min(len(tasks), 3)))
                if not valid:
                    print(f'{pid} J{day_key}: BAD FORMAT keys={list(guided.keys())[:5]}')
                    continue
                
                # Merge with existing
                merged = gs.copy() if gs else {}
                for k, v in guided.items():
                    if not merged.get(k) and isinstance(v, list):
                        merged[k] = v
                
                db.programs.update_one({'id': pid}, {'$set': {f'daily_tasks_template.{day_key}.guided_steps': merged}})
                total += 1
                print(f'{pid} J{day_key}: OK')
            except Exception as e:
                print(f'{pid} J{day_key}: ERR {str(e)[:60]}')
    
    print(f'DONE: {total} jours')

asyncio.run(main())
