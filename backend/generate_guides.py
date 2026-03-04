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
            if day_data.get('guided_steps'): continue
            tasks = day_data.get('tasks', [])
            if not tasks: continue
            tasks_str = '\n'.join(f'{i}. {t}' for i, t in enumerate(tasks))
            prompt = f"""Programme: {prog['title']}
Jour {day_key} - {day_data.get('focus','')}
Taches:
{tasks_str}

Pour CHAQUE tache, 2-3 etapes guidees. JSON:
{{"0": [{{"instruction": "...", "icon": "ri-xxx-line"}}, {{"instruction": "Fait ?", "validate": true}}], "1": [...], "2": [...]}}"""
            try:
                chat = LlmChat(api_key=api_key, session_id=f'gs-{pid}-{day_key}', system_message='JSON uniquement.').with_model('openai', 'gpt-5.2')
                r = (await chat.send_message(UserMessage(text=prompt))).strip()
                if r.startswith('```'): r = r.split('\n', 1)[1] if '\n' in r else r[3:]
                if r.endswith('```'): r = r[:-3]
                guided = json.loads(r.strip())
                db.programs.update_one({'id': pid}, {'$set': {f'daily_tasks_template.{day_key}.guided_steps': guided}})
                total += 1
                print(f'{pid} J{day_key}: OK')
            except Exception as e:
                print(f'{pid} J{day_key}: ERR {str(e)[:60]}')
    print(f'DONE: {total} jours generes')

asyncio.run(main())
