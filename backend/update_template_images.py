"""One-time script to update template images with real photos"""
import asyncio
from database import db

# ── Exercise images mapping ──
EXERCISE_IMAGES = {
    "Squat": "https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Developpe couche": "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Souleve de terre": "https://images.unsplash.com/photo-1772450014622-1c209d012c2e?w=400&fit=crop",
    "Tractions": "https://images.pexels.com/photos/7187872/pexels-photo-7187872.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Pompes": "https://images.unsplash.com/photo-1758599878868-52cced2f8154?w=400&fit=crop",
    "Fentes marchees": "https://images.unsplash.com/photo-1609899517237-77d357b047cf?w=400&fit=crop",
    "Rowing barre": "https://images.unsplash.com/photo-1688521010985-4cd76e4fcfde?w=400&fit=crop",
    "Presse a cuisses": "https://images.unsplash.com/photo-1579854602908-ce7e7c29f4fd?w=400&fit=crop",
    "Curl biceps": "https://images.unsplash.com/photo-1759300642292-ffe3cb347548?w=400&fit=crop",
    "Extensions triceps": "https://images.pexels.com/photos/5327571/pexels-photo-5327571.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Developpe militaire": "https://images.pexels.com/photos/14591574/pexels-photo-14591574.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Planche gainage": "https://images.unsplash.com/photo-1758599879661-a656f9678ce2?w=400&fit=crop",
    "Crunchs": "https://images.unsplash.com/photo-1758599878868-52cced2f8154?w=400&fit=crop",
    "Hip thrust": "https://images.pexels.com/photos/6516221/pexels-photo-6516221.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Mollets debout": "https://images.pexels.com/photos/13965339/pexels-photo-13965339.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Course a pied": "https://images.unsplash.com/photo-1758520705390-ccfc66f2b18a?w=400&fit=crop",
    "Velo / Spinning": "https://images.unsplash.com/photo-1760031670160-4da44e9596d0?w=400&fit=crop",
    "Corde a sauter": "https://images.unsplash.com/photo-1770026136375-9b9d038300e1?w=400&fit=crop",
    "Burpees": "https://images.pexels.com/photos/6388464/pexels-photo-6388464.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Etirements complets": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&fit=crop",
}

# ── Hydration images mapping ──
HYDRATION_IMAGES = {
    "Smoothie fraise-banane": "https://images.unsplash.com/photo-1633108787619-9455a0ca4522?w=400&fit=crop",
    "Smoothie vert detox": "https://images.pexels.com/photos/8169572/pexels-photo-8169572.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Smoothie proteine chocolat": "https://images.pexels.com/photos/4112870/pexels-photo-4112870.png?auto=compress&cs=tinysrgb&w=400",
    "Smoothie tropical mangue-ananas": "https://images.pexels.com/photos/32647253/pexels-photo-32647253.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Smoothie myrtilles-avoine": "https://images.pexels.com/photos/11136333/pexels-photo-11136333.jpeg?auto=compress&cs=tinysrgb&w=400",
    "The vert matcha latte": "https://images.pexels.com/photos/33143522/pexels-photo-33143522.jpeg?auto=compress&cs=tinysrgb&w=400",
    "The vert sencha": "https://images.unsplash.com/photo-1611836579732-d4dd63dc5492?w=400&fit=crop",
    "Infusion gingembre-citron": "https://images.unsplash.com/photo-1561224405-404727f24af6?w=400&fit=crop",
    "Tisane camomille-lavande": "https://images.unsplash.com/photo-1632639520506-351061db58fc?w=400&fit=crop",
    "Tisane menthe-verveine": "https://images.pexels.com/photos/36228277/pexels-photo-36228277.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Eau detox concombre-citron-menthe": "https://images.pexels.com/photos/5817517/pexels-photo-5817517.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Eau fraise-basilic": "https://images.pexels.com/photos/5817521/pexels-photo-5817521.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Bouillon d'os maison": "https://images.unsplash.com/photo-1761748615918-3da7148e41f0?w=400&fit=crop",
    "Bouillon de legumes anti-inflammatoire": "https://images.unsplash.com/photo-1627880872609-f7ddd76616c2?w=400&fit=crop",
    "Eau de coco naturelle": "https://images.pexels.com/photos/12580174/pexels-photo-12580174.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Boisson electrolytes maison": "https://images.unsplash.com/photo-1561224405-404727f24af6?w=400&fit=crop",
    "Golden milk (lait d'or)": "https://images.unsplash.com/photo-1641763960090-94c5066f81c9?w=400&fit=crop",
    "Jus vert epinard-pomme-celeri": "https://images.pexels.com/photos/16963896/pexels-photo-16963896.jpeg?auto=compress&cs=tinysrgb&w=400",
    "Jus betterave-carotte-pomme": "https://images.pexels.com/photos/30635730/pexels-photo-30635730.jpeg?auto=compress&cs=tinysrgb&w=400",
}


async def update_images():
    # Update exercise templates
    ex_updated = 0
    for title, img_url in EXERCISE_IMAGES.items():
        result = await db.pro_exercise_templates.update_many(
            {"title": title, "image": {"$in": ["", None]}},
            {"$set": {"image": img_url}}
        )
        if result.modified_count > 0:
            ex_updated += result.modified_count
            print(f"  Exercise '{title}': {result.modified_count} updated")

    # Update hydration templates
    hyd_updated = 0
    for title, img_url in HYDRATION_IMAGES.items():
        result = await db.pro_reminder_templates.update_many(
            {"title": title, "reminder_type": "hydration"},
            {"$set": {"image": img_url}}
        )
        if result.modified_count > 0:
            hyd_updated += result.modified_count
            print(f"  Hydration '{title}': {result.modified_count} updated")

    print(f"\nDone! Exercises: {ex_updated}, Hydrations: {hyd_updated}")


if __name__ == "__main__":
    asyncio.run(update_images())
