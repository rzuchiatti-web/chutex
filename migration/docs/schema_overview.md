# Mapping et conventions schéma Mongo → Postgres

## Vue d'ensemble (92 collections)

| Domaine        | # tables | Module Python                |
|----------------|----------|------------------------------|
| Auth           | 3        | `app/models/auth.py`         |
| Shop / Paiement | 8        | `app/models/shop.py`         |
| Health         | 13       | `app/models/health.py`       |
| Alerts         | 14       | `app/models/alerts.py`       |
| Devices        | 8        | `app/models/devices.py`      |
| Guardian / SAAD | 17       | `app/models/guardian.py`     |
| Pro space      | 13       | `app/models/pro.py`          |
| Programs       | 12       | `app/models/programs.py`     |
| Notifications  | 12       | `app/models/notifications.py` |
| Misc / RGPD    | 21       | `app/models/misc.py`         |

## Conventions

- **Clé primaire `id`** : `String(64)` (compatible avec les `uuid4().hex` du backend actuel et avec d'éventuels IDs externes Stripe/Mollie).
- **Clés primaires composites** quand la collection Mongo n'a pas d'ID propre (`scale_members`, `latest_vitals`, `program_task_progress`, `nora_*_cache` user/date, etc.).
- **`created_at` / `updated_at`** en `TIMESTAMPTZ` avec defaults serveur. Les chaînes ISO 8601 du Mongo sont parsées dans `migrate_data.py`.
- **`JSONB`** pour tout sous-document Mongo flexible (settings, payloads, listes d'objets imbriqués). C'est requêtable et indexable côté Postgres.
- **Index** sur : `email`, `phone`, `user_id`, `beneficiary_id`, `professional_id`, `status`, `created_at`, `mac`, etc.
- **Statuts** stockés en `String` plutôt qu'`ENUM` Postgres pour rester souple.

## Décisions notables

- `device_readings` vs `weighings` : conservés en deux tables car `weighings` est utilisée
  par l'app comme historique stable côté UI, alors que `device_readings` est le bucket
  brut volumineux (~80k+).
- `health_vitals` (historique) ↔ `latest_vitals` (snapshot 1 ligne / utilisateur) : deux tables.
- Tous les **caches LLM** (`nora_*`, `daily_report_cache`, `body_age_cache`,
  `personalized_tasks_cache`, `health_summary_cache`) sont gardés. Ils peuvent être tronqués
  sans perte fonctionnelle.
- `health_data` est volontairement très générique (`type` + `payload JSONB`) car la collection
  Mongo correspondante était utilisée comme bucket fourre-tout.

## Comment ajouter une table

1. Ajoute la classe dans le bon module sous `app/models/`.
2. Vérifie qu'elle est bien importée via `app/models/__init__.py`.
3. Ajoute le mapping dans `scripts/migrate_data.py` → `COLLECTION_TO_MODEL`.
4. `alembic revision --autogenerate -m "add table xyz"` puis `alembic upgrade head`.
