"""
Setup test accounts for complete SOS alert flow testing.
Run: python3 /app/backend/setup_test_accounts.py
"""
import asyncio
import os
import uuid
import bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ.get("DB_NAME", "test_database")]


def hp(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


NOW = datetime.now(timezone.utc).isoformat()
PASSWORD = hp("test123")


async def setup():
    # ============== 1. GET JOSETTE (main beneficiary) ==============
    josette = await db.users.find_one({"phone": "+33651245918", "role": "beneficiary", "guardians": {"$ne": []}}, {"_id": 0})
    if not josette:
        # Try any josette
        josette = await db.users.find_one({"name": {"$regex": "Josette"}, "role": "beneficiary"}, {"_id": 0})
    if not josette:
        print("ERROR: Josette beneficiary not found!")
        return
    josette_id = josette['id']
    print(f"Found Josette: id={josette_id}, phone={josette.get('phone')}")

    # Remove duplicate Josette accounts (keep the one with guardians)
    dups = await db.users.find({"name": {"$regex": "Josette"}, "role": "beneficiary", "id": {"$ne": josette_id}}, {"_id": 0}).to_list(10)
    for d in dups:
        print(f"  Removing duplicate Josette: {d['id']}")
        await db.users.delete_one({"id": d['id']})
        await db.subscriptions.delete_many({"beneficiary_id": d['id']})

    # Ensure Josette has geolocation (Saint-Chamond area)
    await db.users.update_one({"id": josette_id}, {"$set": {
        "latitude": 45.4737, "longitude": 4.5134,
        "address": "14 rue de la Republique, 42400 Saint-Chamond",
    }})
    # Ensure location record
    await db.locations.update_one(
        {"user_id": josette_id},
        {"$set": {"user_id": josette_id, "latitude": 45.4737, "longitude": 4.5134, "updated_at": NOW}},
        upsert=True,
    )

    # ============== 2. ADD FRANCK ZUCHIATTI as guardian ==============
    franck_phone = "+33630686585"
    franck = await db.users.find_one({"phone": {"$regex": franck_phone[-9:]}}, {"_id": 0})
    if franck:
        franck_id = franck['id']
        print(f"Franck ZUCHIATTI already exists: id={franck_id}")
        # Ensure he's a guardian
        await db.users.update_one({"id": franck_id}, {"$set": {
            "role": "guardian", "name": "Franck ZUCHIATTI", "phone": franck_phone,
            "guardian_type": "particular", "address": "Saint-Chamond",
        }})
    else:
        franck_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": franck_id, "email": "franck.zuchiatti@test.fr",
            "password_hash": PASSWORD, "name": "Franck ZUCHIATTI",
            "phone": franck_phone, "role": "guardian",
            "guardian_type": "particular",
            "address": "14 rue de la Republique, 42400 Saint-Chamond",
            "created_at": NOW, "beneficiaries": [], "guardians": [],
            "location_sharing": "alert_only",
            "date_of_birth": "", "gender": "Homme",
            "height_cm": None, "weight_kg": None,
            "blood_type": "", "allergies": "", "medical_conditions": "",
            "emergency_contact_name": "", "emergency_contact_phone": "",
            "doctor_name": "", "structure_name": "", "siret": "",
            "profession": "", "relationship": "",
            "is_prescriber": False, "is_intervention_provider": False,
        })
        print(f"Created Franck ZUCHIATTI: id={franck_id}, phone={franck_phone}")

    # Link Franck to Josette
    await db.users.update_one({"id": josette_id}, {"$addToSet": {"guardians": franck_id, "guardian_order": franck_id}})
    await db.users.update_one({"id": franck_id}, {"$addToSet": {"beneficiaries": josette_id}})
    # Store relationship
    await db.guardian_relationships.update_one(
        {"guardian_id": franck_id, "beneficiary_id": josette_id},
        {"$set": {"relationship": "Fils", "relationship_type": "family", "updated_at": NOW}},
        upsert=True,
    )
    print(f"Linked Franck ZUCHIATTI -> Josette as 'Fils'")

    # ============== 3. SAAD 1: "SAAD Aide a Domicile Loire" (existing) ==============
    saad1 = await db.users.find_one({"role": "prescriber_company", "email": "saad@aide-domicile.fr"}, {"_id": 0})
    if not saad1:
        saad1 = await db.users.find_one({"role": "prescriber_company"}, {"_id": 0})
    if saad1:
        saad1_id = saad1['id']
        print(f"SAAD 1 exists: {saad1.get('structure_name', saad1.get('name',''))} id={saad1_id}")
    else:
        saad1_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": saad1_id, "email": "saad@aide-domicile.fr", "password_hash": PASSWORD,
            "name": "Marie Dupont", "phone": "+33499887766", "role": "prescriber_company",
            "created_at": NOW, "beneficiaries": [], "guardians": [],
            "structure_name": "SAAD Aide a Domicile Loire", "siret": "66677788800056",
            "location_sharing": "alert_only", "date_of_birth": "", "gender": "Femme",
            "address": "12 rue de la Loire, 42000 Saint-Etienne",
            "guardian_type": "", "relationship": "",
            "is_prescriber": False, "commission_type": "monthly", "onboarding_completed": True,
        })
        print(f"Created SAAD 1: SAAD Aide a Domicile Loire, id={saad1_id}")

    # Ensure SAAD 1 has agencies near Josette
    ag1_name = "Agence Saint-Chamond"
    ag1 = await db.agencies.find_one({"company_id": saad1_id, "name": ag1_name}, {"_id": 0})
    if not ag1:
        # Check if "ABC DOMICILE" exists and update it
        ag1 = await db.agencies.find_one({"company_id": saad1_id, "name": "ABC DOMICILE"}, {"_id": 0})
        if ag1:
            await db.agencies.update_one({"id": ag1['id']}, {"$set": {
                "name": ag1_name, "address": "Place de l'Hotel de Ville, 42400 Saint-Chamond",
                "latitude": 45.4730, "longitude": 4.5110, "radius_km": 30,
            }})
            print(f"Updated agency ABC DOMICILE -> {ag1_name}")
        else:
            ag1_id = str(uuid.uuid4())
            await db.agencies.insert_one({
                "id": ag1_id, "company_id": saad1_id, "name": ag1_name,
                "address": "Place de l'Hotel de Ville, 42400 Saint-Chamond",
                "latitude": 45.4730, "longitude": 4.5110, "radius_km": 30,
                "created_at": NOW,
            })
            ag1 = {"id": ag1_id}
            print(f"Created agency {ag1_name}: lat=45.4730, lng=4.5110, radius=30km")
    else:
        # Ensure correct location
        await db.agencies.update_one({"id": ag1['id']}, {"$set": {
            "latitude": 45.4730, "longitude": 4.5110, "radius_km": 30,
            "address": "Place de l'Hotel de Ville, 42400 Saint-Chamond",
        }})
    ag1_id = ag1['id']

    # Ensure the Lyon agency exists
    ag_lyon = await db.agencies.find_one({"company_id": saad1_id, "name": {"$regex": "[Ll]yon"}}, {"_id": 0})
    if not ag_lyon:
        ag_lyon_id = str(uuid.uuid4())
        await db.agencies.insert_one({
            "id": ag_lyon_id, "company_id": saad1_id, "name": "Agence de Lyon",
            "address": "15 Rue de la Republique, 69001 Lyon",
            "latitude": 45.7640, "longitude": 4.8357, "radius_km": 25,
            "created_at": NOW,
        })
        ag_lyon = {"id": ag_lyon_id}
        print(f"Created agency Agence de Lyon: lat=45.7640, lng=4.8357, radius=25km")
    ag_lyon_id = ag_lyon['id']

    # Create Guardian 1 for SAAD 1: Sophie MARTIN (aide a domicile, assigned to Saint-Chamond agency)
    sophie_phone = "+33611223344"
    sophie = await db.users.find_one({"phone": {"$regex": sophie_phone[-9:]}}, {"_id": 0})
    if not sophie:
        sophie_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": sophie_id, "email": "sophie.martin@saad1.fr",
            "password_hash": PASSWORD, "name": "Sophie MARTIN",
            "phone": sophie_phone, "role": "guardian",
            "guardian_type": "professional", "profession": "Auxiliaire de vie",
            "structure_name": "SAAD Aide a Domicile Loire",
            "address": "42400 Saint-Chamond",
            "created_at": NOW, "beneficiaries": [], "guardians": [],
            "location_sharing": "alert_only",
            "is_prescriber": True, "prescriber_structure": "SAAD Aide a Domicile Loire",
            "prescriber_company_id": saad1_id,
            "is_intervention_provider": True,
            "intervention_structure": "SAAD Aide a Domicile Loire",
            "intervention_radius_km": 30,
            "saad_company_id": saad1_id,
            "saad_company_name": "SAAD Aide a Domicile Loire",
            "agency_id": ag1_id,
            "latitude": 45.4750, "longitude": 4.5100,
            "date_of_birth": "", "gender": "Femme",
        })
        sophie = {"id": sophie_id}
        print(f"Created Sophie MARTIN (SAAD1 - Saint-Chamond): id={sophie_id}")
        # Link to SAAD
        await db.saad_guardian_links.insert_one({
            "id": str(uuid.uuid4()), "company_id": saad1_id,
            "company_name": "SAAD Aide a Domicile Loire",
            "guardian_id": sophie_id, "guardian_phone": sophie_phone,
            "guardian_name": "Sophie MARTIN",
            "status": "accepted", "created_at": NOW,
        })
    else:
        sophie_id = sophie['id']
        # Update to ensure SAAD fields are correct
        await db.users.update_one({"id": sophie_id}, {"$set": {
            "saad_company_id": saad1_id, "saad_company_name": "SAAD Aide a Domicile Loire",
            "prescriber_company_id": saad1_id, "agency_id": ag1_id,
            "is_intervention_provider": True, "is_prescriber": True,
        }})
        print(f"Sophie MARTIN already exists: id={sophie_id}")

    # Update Fabrice COMMEAT (existing) - ensure he's linked to SAAD1 properly
    fabrice = await db.users.find_one({"name": {"$regex": "Fabrice"}}, {"_id": 0})
    if fabrice:
        await db.users.update_one({"id": fabrice['id']}, {"$set": {
            "saad_company_id": saad1_id, "saad_company_name": "SAAD Aide a Domicile Loire",
            "prescriber_company_id": saad1_id,
            "agency_id": ag_lyon_id,
            "is_intervention_provider": True,
        }})
        print(f"Updated Fabrice COMMEAT: saad={saad1_id}, agency={ag_lyon_id}")

    # ============== 4. SAAD 2: "SAAD Saint-Etienne Centre" ==============
    saad2_email = "saad2@steti-centre.fr"
    saad2 = await db.users.find_one({"email": saad2_email}, {"_id": 0})
    if not saad2:
        saad2_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": saad2_id, "email": saad2_email, "password_hash": PASSWORD,
            "name": "Jean-Pierre ROUX", "phone": "+33477556688", "role": "prescriber_company",
            "created_at": NOW, "beneficiaries": [], "guardians": [],
            "structure_name": "SAAD Saint-Etienne Centre", "siret": "77788899900011",
            "location_sharing": "alert_only", "date_of_birth": "", "gender": "Homme",
            "address": "5 Place Jean Jaures, 42000 Saint-Etienne",
            "guardian_type": "", "relationship": "",
            "is_prescriber": False, "commission_type": "monthly", "onboarding_completed": True,
        })
        saad2 = {"id": saad2_id}
        print(f"Created SAAD 2: SAAD Saint-Etienne Centre, id={saad2_id}")
    else:
        saad2_id = saad2['id']
        print(f"SAAD 2 already exists: id={saad2_id}")

    # Create agency for SAAD 2 (Saint-Etienne - near Josette but farther than Saint-Chamond)
    ag2_name = "Agence Saint-Etienne"
    ag2 = await db.agencies.find_one({"company_id": saad2_id, "name": ag2_name}, {"_id": 0})
    if not ag2:
        ag2_id = str(uuid.uuid4())
        await db.agencies.insert_one({
            "id": ag2_id, "company_id": saad2_id, "name": ag2_name,
            "address": "5 Place Jean Jaures, 42000 Saint-Etienne",
            "latitude": 45.4397, "longitude": 4.3872, "radius_km": 35,
            "created_at": NOW,
        })
        ag2 = {"id": ag2_id}
        print(f"Created agency {ag2_name}: lat=45.4397, lng=4.3872, radius=35km")
    else:
        ag2_id = ag2['id']
        await db.agencies.update_one({"id": ag2_id}, {"$set": {
            "latitude": 45.4397, "longitude": 4.3872, "radius_km": 35,
        }})

    # Create Guardian for SAAD 2: Laurent DUBOIS
    laurent_phone = "+33655667788"
    laurent = await db.users.find_one({"phone": {"$regex": laurent_phone[-9:]}}, {"_id": 0})
    if not laurent:
        laurent_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": laurent_id, "email": "laurent.dubois@saad2.fr",
            "password_hash": PASSWORD, "name": "Laurent DUBOIS",
            "phone": laurent_phone, "role": "guardian",
            "guardian_type": "professional", "profession": "Aide a domicile",
            "structure_name": "SAAD Saint-Etienne Centre",
            "address": "42000 Saint-Etienne",
            "created_at": NOW, "beneficiaries": [], "guardians": [],
            "location_sharing": "alert_only",
            "is_prescriber": True, "prescriber_structure": "SAAD Saint-Etienne Centre",
            "prescriber_company_id": saad2_id,
            "is_intervention_provider": True,
            "intervention_structure": "SAAD Saint-Etienne Centre",
            "intervention_radius_km": 35,
            "saad_company_id": saad2_id,
            "saad_company_name": "SAAD Saint-Etienne Centre",
            "agency_id": ag2_id,
            "latitude": 45.4400, "longitude": 4.3880,
            "date_of_birth": "", "gender": "Homme",
        })
        laurent = {"id": laurent_id}
        print(f"Created Laurent DUBOIS (SAAD2 - Saint-Etienne): id={laurent_id}")
        # Link to SAAD
        await db.saad_guardian_links.insert_one({
            "id": str(uuid.uuid4()), "company_id": saad2_id,
            "company_name": "SAAD Saint-Etienne Centre",
            "guardian_id": laurent_id, "guardian_phone": laurent_phone,
            "guardian_name": "Laurent DUBOIS",
            "status": "accepted", "created_at": NOW,
        })
    else:
        laurent_id = laurent['id']
        await db.users.update_one({"id": laurent_id}, {"$set": {
            "saad_company_id": saad2_id, "saad_company_name": "SAAD Saint-Etienne Centre",
            "prescriber_company_id": saad2_id, "agency_id": ag2_id,
            "is_intervention_provider": True, "is_prescriber": True,
        }})
        print(f"Laurent DUBOIS already exists: id={laurent_id}")

    # ============== 5. ENSURE ACTIVE SUBSCRIPTION FOR JOSETTE ==============
    sub = await db.subscriptions.find_one({"beneficiary_id": josette_id, "status": "active"}, {"_id": 0})
    if not sub:
        await db.subscriptions.insert_one({
            "id": str(uuid.uuid4()),
            "beneficiary_phone": josette.get("phone", "+33651245918"),
            "beneficiary_id": josette_id,
            "subscription_type": "care",
            "status": "active",
            "source": "test",
            "created_at": NOW,
            "updated_at": NOW,
        })
        print("Created Care subscription for Josette")
    else:
        print(f"Josette already has active subscription: {sub.get('subscription_type')}")

    # ============== 6. CLEAN UP OLD PENDING INTERVENTIONS ==============
    # Update old pending interventions to include company_id for proper matching
    agencies_list = await db.agencies.find({}, {"_id": 0}).to_list(50)
    agency_company_map = {a['id']: a.get('company_id', '') for a in agencies_list}

    old_ivs = await db.interventions.find({"status": "pending_acceptance", "company_id": {"$in": [None, ""]}}, {"_id": 0}).to_list(50)
    for iv in old_ivs:
        ag_id = iv.get('agency_id', '')
        company_id = agency_company_map.get(ag_id, '')
        if company_id:
            await db.interventions.update_one({"id": iv['id']}, {"$set": {"company_id": company_id}})
            print(f"Fixed intervention {iv['id'][:8]}: set company_id={company_id[:12]}")

    # ============== SUMMARY ==============
    print("\n" + "="*60)
    print("TEST ACCOUNTS SUMMARY")
    print("="*60)

    # Refresh Josette
    josette = await db.users.find_one({"id": josette_id}, {"_id": 0, "password_hash": 0})
    print(f"\nBENEFICIAIRE:")
    print(f"  Josette Zuchiatti | Tel: {josette.get('phone')} | Mot de passe: test123")
    print(f"  Localisation: Saint-Chamond ({josette.get('latitude')}, {josette.get('longitude')})")
    print(f"  Gardiens: {len(josette.get('guardians', []))}")

    print(f"\nGARDIENS DE JOSETTE:")
    for gid in josette.get('guardians', []):
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g:
            rel = await db.guardian_relationships.find_one({"guardian_id": gid, "beneficiary_id": josette_id}, {"_id": 0})
            rel_str = (rel or {}).get('relationship', g.get('relationship', ''))
            print(f"  {g['name']} | Tel: {g.get('phone')} | {rel_str} | saad={g.get('saad_company_id','Non')}")

    print(f"\nSAAD 1: SAAD Aide a Domicile Loire")
    print(f"  Admin: saad@aide-domicile.fr | Mot de passe: test123")
    ag1_list = await db.agencies.find({"company_id": saad1_id}, {"_id": 0}).to_list(10)
    for a in ag1_list:
        print(f"  Agence: {a['name']} | Lat:{a.get('latitude')} Lng:{a.get('longitude')} | Rayon:{a.get('radius_km')}km")
    s1_links = await db.saad_guardian_links.find({"company_id": saad1_id, "status": "accepted"}, {"_id": 0}).to_list(10)
    for l in s1_links:
        g = await db.users.find_one({"id": l.get('guardian_id')}, {"_id": 0, "password_hash": 0})
        if g:
            print(f"  Intervenant: {g['name']} | Tel: {g.get('phone')} | Agence: {g.get('agency_id','')[:12]} | Mot de passe: test123")

    saad2 = await db.users.find_one({"email": saad2_email}, {"_id": 0, "password_hash": 0})
    if saad2:
        print(f"\nSAAD 2: SAAD Saint-Etienne Centre")
        print(f"  Admin: {saad2_email} | Mot de passe: test123")
        ag2_list = await db.agencies.find({"company_id": saad2['id']}, {"_id": 0}).to_list(10)
        for a in ag2_list:
            print(f"  Agence: {a['name']} | Lat:{a.get('latitude')} Lng:{a.get('longitude')} | Rayon:{a.get('radius_km')}km")
        s2_links = await db.saad_guardian_links.find({"company_id": saad2['id'], "status": "accepted"}, {"_id": 0}).to_list(10)
        for l in s2_links:
            g = await db.users.find_one({"id": l.get('guardian_id')}, {"_id": 0, "password_hash": 0})
            if g:
                print(f"  Intervenant: {g['name']} | Tel: {g.get('phone')} | Mot de passe: test123")

    # Distance check
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    print(f"\nDISTANCES DEPUIS JOSETTE (45.4737, 4.5134):")
    all_agencies = await db.agencies.find({"latitude": {"$ne": None}}, {"_id": 0}).to_list(50)
    for a in all_agencies:
        d = haversine(45.4737, 4.5134, a['latitude'], a['longitude'])
        in_range = "OUI" if d <= a.get('radius_km', 30) else "NON"
        print(f"  {a['name']}: {d:.1f}km (rayon {a.get('radius_km')}km) -> {in_range}")

    # Count pending interventions
    pending_count = await db.interventions.count_documents({"status": "pending_acceptance"})
    print(f"\nINTERVENTIONS en attente: {pending_count}")

    print("\n" + "="*60)
    print("SCENARIOS DE TEST")
    print("="*60)
    print("1. Connexion Josette: +33651245918 / test123")
    print("2. Declenchement alerte SOS -> Nora appelle Josette")
    print("3. Si Josette dit 'ca va' -> Alerte resolue")
    print("4. Si Josette dit 'j'ai besoin d'aide' -> Appel gardien Franck")
    print("5. Si Josette ne repond pas -> Appel gardien Franck")
    print("6. Si Franck ne repond pas -> Dispatch SAAD plus proche")
    print(f"   -> {ag1_name} est a ~0.3km = DOIT etre selectionne en priorite")
    print("7. Connexion Sophie MARTIN (sophie.martin@saad1.fr / test123)")
    print("   -> Doit voir la mission d'intervention dans ses notifications")
    print("8. Sophie accepte -> Les gardiens de Josette voient le suivi")
    print("="*60)


asyncio.run(setup())
