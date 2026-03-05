import asyncio, os, json, pymongo

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
            # Check if ALL tasks have guided_steps
            needs_gen = any(not gs.get(str(i)) for i in range(len(tasks)))
            if not needs_gen:
                continue
            
            tasks_str = '\n'.join(f'{i}. {t}' for i, t in enumerate(tasks))
            prompt = f"""Programme: {prog['title']}
Jour {day_key} - {day_data.get('focus','')}

Taches:
{tasks_str}

Pour CHAQUE tache (0,1,2), genere 2-4 etapes guidees avec des CHOIX (boutons cliquables).
Chaque etape a: instruction, icon (ri-xxx-line), et choices (liste de reponses possibles).
La derniere etape doit avoir validate: true.

Exemple:
{{"0": [
  {{"instruction": "Positionnez-vous pres d'un mur", "icon": "ri-shield-check-line"}},
  {{"instruction": "Maintenez 30 secondes", "icon": "ri-timer-line"}},
  {{"instruction": "Avez-vous reussi ?", "icon": "ri-check-line", "choices": ["Oui facilement", "Oui avec difficulte", "Non"], "validate": true}}
]}}

JSON uniquement, pas de markdown:"""

            try:
                chat = LlmChat(api_key=api_key, session_id=f'gs2-{pid}-{day_key}',
                    system_message='JSON uniquement. Etapes guidees avec choices.').with_model('openai', 'gpt-5.2')
                r = (await chat.send_message(UserMessage(text=prompt))).strip()
                if r.startswith('```'): r = r.split('\n', 1)[1] if '\n' in r else r[3:]
                if r.endswith('```'): r = r[:-3]
                guided = json.loads(r.strip())
                
                # Merge with existing (keep manually set ones)
                merged = gs.copy() if gs else {}
                for k, v in guided.items():
                    if not merged.get(k):
                        merged[k] = v
                
                db.programs.update_one({'id': pid}, {'$set': {f'daily_tasks_template.{day_key}.guided_steps': merged}})
                total += 1
                print(f'{pid} J{day_key}: OK ({len(guided)} tasks)')
            except Exception as e:
                print(f'{pid} J{day_key}: ERR {str(e)[:60]}')
    
    print(f'DONE: {total} jours generes')

asyncio.run(main())
