# Chutex Care — Migration MongoDB → PostgreSQL

Paquet **autonome** permettant de recréer toute la base de données Chutex Care
sur PostgreSQL à partir des modèles SQLAlchemy fournis, en utilisant Alembic
pour la gestion des migrations.

Ce dossier est **indépendant** du backend FastAPI actuel. Il est conçu pour
être copié dans le repository de ta nouvelle API externe.

## Contenu

```
migration/
├── README.md                       # Ce fichier
├── requirements.txt                # Dépendances Python
├── .env.example                    # Variables d'environnement
├── alembic.ini                     # Configuration Alembic
├── alembic/
│   ├── env.py                      # Hook Alembic ↔ SQLAlchemy
│   ├── script.py.mako              # Template des fichiers de migration
│   └── versions/
│       └── 0001_initial_schema.py  # Migration initiale (92 tables)
├── app/
│   ├── __init__.py
│   ├── database.py                 # Engine + SessionLocal SQLAlchemy
│   └── models/
│       ├── __init__.py             # Re-exports tous les modèles
│       ├── base.py                 # Base déclarative + types communs
│       ├── auth.py                 # users, verification_codes, ...
│       ├── shop.py                 # shop_orders, contracts, subscriptions, ...
│       ├── health.py               # health_vitals, ecg_records, weighings, ...
│       ├── alerts.py               # alerts, teleconsults, interventions, ...
│       ├── devices.py              # devices, bracelet_commands, dorsi_*, ...
│       ├── guardian.py             # guardians, saad_*, activation_codes, ...
│       ├── pro.py                  # pro_* (coachs, kinés, applications)
│       ├── programs.py             # programs, program_*, team_*, minceur_*
│       ├── notifications.py        # notifications, push_*, reminders, ...
│       └── misc.py                 # chat_messages, streaks, caches Nora, ...
├── scripts/
│   ├── migrate_data.py             # Copie Mongo → Postgres (idempotent)
│   └── verify_migration.py         # Compare counts Mongo vs Postgres
└── docs/
    └── schema_overview.md          # Mapping Mongo → Postgres et conventions
```

## Stack technique

- **PostgreSQL** ≥ 14 (utilise `JSONB`, `UUID`, `TIMESTAMPTZ`)
- **SQLAlchemy** 2.x (syntaxe moderne `Mapped` / `mapped_column`)
- **Alembic** ≥ 1.13
- **psycopg** (driver synchrone) pour les migrations
- **asyncpg** disponible pour l'API async

## Installation

```bash
cd migration
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # puis éditer DATABASE_URL
```

## Utilisation

### 1. Créer la base PostgreSQL

```bash
createdb chutex_care
# ou
psql -c "CREATE DATABASE chutex_care;"
```

### 2. Appliquer les migrations

```bash
alembic upgrade head
```

Cela créera les **92 tables** + index + contraintes.

### 3. (Optionnel) Migrer les données depuis MongoDB

```bash
# Définir aussi MONGO_URL dans .env
python scripts/migrate_data.py
```

Le script est **idempotent** : il utilise `INSERT ... ON CONFLICT DO NOTHING`.
Tu peux le relancer sans risque.

### 4. Vérifier

```bash
python scripts/verify_migration.py
```

Affiche le nombre de documents Mongo vs lignes Postgres pour chaque table.

## Conventions de modélisation

- **Clé primaire** : `id` (UUID stocké en `String(64)` pour rester compatible
  avec les IDs string générés par `uuid.uuid4().hex` côté backend actuel).
- **Timestamps** : tous les champs `created_at` / `updated_at` sont en
  `TIMESTAMPTZ`. Les chaînes ISO 8601 stockées dans Mongo sont parsées au moment
  de la migration.
- **Sous-documents flexibles** (settings, configurations, payloads de webhook,
  réponses de questionnaires) → stockés en `JSONB`. Cela évite l'explosion de
  tables annexes sans valeur ajoutée.
- **Listes simples** (tags, badges, etc.) → `JSONB` également, sauf relations
  fortes (ex: `program_enrollments.completed_days`).
- **Foreign keys** déclarées vers `users.id` quand le lien est clair, en
  `ON DELETE CASCADE` pour les données dérivées (alertes, mesures…), en
  `ON DELETE SET NULL` pour les liens optionnels.
- **Index** sur tous les champs de recherche fréquente : `email`, `phone`,
  `user_id`, `status`, `created_at`, `mac`, etc.
- **Enums** : conservés en `String` pour rester souple (les valeurs évoluent
  vite côté app). Si tu veux des `ENUM` Postgres stricts, il suffit de
  remplacer les `String` correspondants.

## Variables d'environnement

| Variable           | Description                                    | Exemple                                       |
|--------------------|------------------------------------------------|-----------------------------------------------|
| `DATABASE_URL`     | URL Postgres synchrone (Alembic + scripts)     | `postgresql+psycopg://user:pass@host/chutex`  |
| `DATABASE_URL_ASYNC` | URL asyncpg pour l'API (optionnel)           | `postgresql+asyncpg://user:pass@host/chutex`  |
| `MONGO_URL`        | URL Mongo source (uniquement migration data)   | `mongodb://localhost:27017`                   |
| `MONGO_DB_NAME`    | Nom de la base Mongo source                    | `chutex_db`                                   |

## Génération de nouvelles migrations

Après modification d'un modèle :

```bash
alembic revision --autogenerate -m "ajout colonne XYZ"
alembic upgrade head
```

## Rollback

```bash
alembic downgrade -1   # revenir d'une révision en arrière
alembic downgrade base # supprimer toutes les tables
```

## Tester rapidement (Docker)

```bash
docker run --name chutex-pg -e POSTGRES_PASSWORD=chutex -e POSTGRES_DB=chutex_care \
  -p 5432:5432 -d postgres:16
export DATABASE_URL=postgresql+psycopg://postgres:chutex@localhost:5432/chutex_care
alembic upgrade head
```

## Notes importantes

- Les **collections vides** au moment du dump (ex: `incidents`, `interventions`,
  `pro_assigned_meals`) ont quand même leur table créée — schéma dérivé du code
  source des routes FastAPI.
- Les caches (`nora_*_cache`, `daily_report_cache`, `body_age_cache`) sont
  conservés car utilisés pour économiser des appels LLM coûteux. Tu peux les
  vider sans danger si tu veux repartir propre.
- Le schéma est conçu pour être **étendu progressivement**. Toute nouvelle
  feature passe par `alembic revision --autogenerate`.
