# Chutex Care — Migration & API externe (PostgreSQL)

Paquet **autonome** contenant :

1. Le schéma SQLAlchemy + migrations Alembic (92 tables)
2. Une API FastAPI prête à déployer sur ton serveur externe
3. Les scripts de migration de données depuis MongoDB

---

## 📂 Contenu

```
migration/
├── README.md                       # ce fichier
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml              # Postgres + API en local
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 0001_initial_schema.py  # 92 tables
│       └── 0002_add_foreign_keys.py # 130 FKs
├── app/                            # Modèles SQLAlchemy
│   ├── database.py
│   └── models/
│       ├── auth.py        shop.py        health.py     alerts.py
│       ├── devices.py     guardian.py    pro.py        programs.py
│       └── notifications.py  misc.py
├── api/                            # Application FastAPI
│   ├── main.py                     # FastAPI app + CORS
│   ├── deps.py                     # Sessions DB + auth JWT
│   ├── security.py                 # bcrypt + JWT helpers
│   ├── catalog.py                  # Catalogue produits Chutex
│   ├── schemas.py                  # Pydantic schemas
│   └── routes/
│       ├── auth.py                 # /api/auth/*
│       ├── shop.py                 # /api/shop/*
│       └── web.py                  # /api/contact, /api/prescriptions, /api/pro-applications
├── scripts/
│   ├── migrate_data.py             # Mongo → Postgres (idempotent)
│   ├── verify_migration.py         # Compare counts
│   └── find_orphans.py             # Détecte les références orphelines
└── docs/
    └── schema_overview.md
```

---

## 🚀 Déploiement rapide (Docker Compose)

```bash
cd migration
cp .env.example .env  # éditer les secrets
docker compose up -d --build
# l'API est sur http://localhost:8000/api
```

---

## 🛠️ Déploiement manuel (Linux)

### 1. Installer les dépendances

```bash
cd migration
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configurer `.env`

```bash
cp .env.example .env
```

Variables obligatoires :
- `DATABASE_URL` — `postgresql+psycopg://user:pass@host:5432/chutex_care`
- `DATABASE_URL_ASYNC` — `postgresql+asyncpg://user:pass@host:5432/chutex_care`
- `JWT_SECRET` — secret long et aléatoire (`openssl rand -hex 32`)
- `MOLLIE_TEST_KEY` ou `MOLLIE_API_KEY` — clé Mollie
- `ALLOWED_ORIGINS` — origines CORS autorisées
- `FRONTEND_BASE_URL` / `API_BASE_URL` — utilisés pour les redirections Mollie

### 3. Créer la base + appliquer les migrations

```bash
createdb chutex_care
alembic upgrade head        # 92 tables + foreign keys (0001 + 0002)
```

### 4. (Optionnel) Migrer les données depuis MongoDB

```bash
python scripts/find_orphans.py        # détecte les orphelins
python scripts/migrate_data.py        # copie les données
python scripts/verify_migration.py    # vérifie la parité
```

### 5. Lancer l'API

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
# ou en prod : gunicorn -k uvicorn.workers.UvicornWorker api.main:app -b 0.0.0.0:8000 -w 4
```

---

## 📡 Endpoints exposés

| Méthode | Endpoint                       | Description                                |
|---------|--------------------------------|--------------------------------------------|
| GET     | `/api/health`                  | Healthcheck                                |
| POST    | `/api/auth/register`           | Création de compte                         |
| POST    | `/api/auth/login`              | Connexion (email ou téléphone)             |
| GET     | `/api/auth/me`                 | Profil de l'utilisateur courant            |
| PUT     | `/api/auth/update-profile`     | Mise à jour du profil                      |
| PUT     | `/api/auth/change-password`    | Changement de mot de passe                 |
| POST    | `/api/auth/send-verification-code` | Envoi d'un code SMS                    |
| POST    | `/api/auth/verify-code`        | Vérification du code SMS                   |
| POST    | `/api/auth/forgot-password`    | Demande de réinitialisation                |
| POST    | `/api/auth/reset-password`     | Application de la réinitialisation         |
| GET     | `/api/shop/products`           | Liste catalogue (filtre `?category=...`)   |
| POST    | `/api/shop/checkout`           | Création paiement Mollie                   |
| GET     | `/api/shop/order/{id}`         | Détail commande                            |
| POST    | `/api/shop/mollie/webhook`     | Webhook Mollie                             |
| POST    | `/api/contact`                 | Formulaire de contact                      |
| POST    | `/api/prescriptions`           | Création prescription (auth requise)       |
| GET     | `/api/prescriptions/me`        | Liste de mes prescriptions                 |
| POST    | `/api/pro-applications`        | Candidature professionnelle                |
| GET     | `/api/pro-applications/{id}`   | Détail candidature                         |

Documentation interactive : `/docs` (Swagger UI) et `/redoc`.

---

## 🔄 Workflow d'évolution

Pour modifier le schéma (ajouter une colonne, etc.) :

```bash
# 1. Modifier le modèle dans app/models/*.py
# 2. Générer la migration
alembic revision --autogenerate -m "ajout colonne X"
# 3. Appliquer
alembic upgrade head
# 4. Push sur Git → ton serveur tirera et relancera `alembic upgrade head`
```

---

## ⚠️ Points d'attention

### Compatibilité avec le backend MongoDB existant

- **Mots de passe** : utilisent bcrypt (compatibles avec l'ancien hash, pas de reset nécessaire au moment de la migration)
- **JWT** : même algorithme HS256, même structure de payload (`user_id`, `role`, `exp`)
- **IDs** : `uuid.uuid4().hex` ou `str(uuid.uuid4())` côté code (32 ou 36 chars)
- **Les tokens existants ne sont PAS valides** sur le nouveau backend (secret JWT différent par défaut)

### CORS

Par défaut `*` (dev). En prod, configure `ALLOWED_ORIGINS=https://www.chutex-care.fr,https://chutex-care.fr`.

### Mollie

L'API utilise `MOLLIE_TEST_KEY` en priorité, puis `MOLLIE_API_KEY`. La webhook URL est construite à partir de `API_BASE_URL`.

### Frontend

Le frontend Vite/React peut pointer sur cette nouvelle API en changeant `REACT_APP_BACKEND_URL`. Aucun changement de code nécessaire côté front.

---

## 🧪 Test local rapide

```bash
# Lance Postgres + API
docker compose up -d --build

# Test
curl http://localhost:8000/api/health
curl http://localhost:8000/api/shop/products | jq '.products | length'

# Documentation
open http://localhost:8000/docs
```
