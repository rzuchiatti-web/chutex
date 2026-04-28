"""Application FastAPI Chutex Care — API externe (Postgres).

Lance avec :

    cd migration
    uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

Endpoints exposés (sous `/api`) :
- /api/auth/*           — register, login, me, password reset, profile
- /api/shop/*           — products, checkout (Mollie), webhook, order
- /api/contact          — formulaire de contact
- /api/prescriptions    — création / liste pour prescripteur
- /api/pro-applications — candidature professionnelle (Coach, Physio, ...)
- /api/health           — healthcheck
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))

from api.routes import auth as auth_routes  # noqa: E402
from api.routes import shop as shop_routes  # noqa: E402
from api.routes import web as web_routes  # noqa: E402

app = FastAPI(
    title="Chutex Care API",
    version="1.0.0",
    description="API externe Chutex Care (PostgreSQL).",
)

# CORS — par défaut permissif, à restreindre en prod via ALLOWED_ORIGINS
allowed = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api")
app.include_router(shop_routes.router, prefix="/api")
app.include_router(web_routes.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
