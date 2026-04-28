"""Application FastAPI Chutex Care — API externe (Postgres).

Lance avec :

    cd migration
    uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

Modules de routes (sous `/api`) :
- /api/auth/*               — register, login, me, password reset, profile
- /api/shop/*               — products, checkout (Mollie), webhook, order
- /api/contact, /api/prescriptions, /api/pro-applications
- /api/notifications/*      — list, unread, read
- /api/push/*               — Expo tokens, preferences, history
- /api/health/thresholds    — seuils
- /api/health/vitals/*      — vitals push, latest, history
- /api/ecg/*, /api/glycemia/*, /api/weighings
- /api/alerts/*             — create, list, resolve, tracking, detail
- /api/alerts/*/live-status — live activity iOS
- /api/intervention/*, /api/interventions/*
- /api/chat/*               — Nora messages + history
- /api/devices/*, /api/scale/*
- /api/bracelet/*           — config, status, commands, ECG history
- /api/dorsi/*              — bilans, programs, score-history
- /api/guardian/*, /api/guardians/*
- /api/programs/*           — catalog, start, stop, active
- /api/reminders/*
- /api/minceur/*
- /api/subscriptions/*, /api/contract/*, /api/plans, /api/stripe/config
- /api/teleassistance/*, /api/escalation/*
- /api/pro/*                — conversations, exercices, repas, rappels assignés
- /api/geofences/*, /api/settings/*, /api/medications/*, /api/recommendations
- /api/streaks, /api/rgpd/*, /api/consent
- /api/nora/*               — analyses cache
- /api/firmware/*           — OTA J2358 V6
- /api/carewatch/*          — incidents
- /api/health                — healthcheck
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
from api.routes import notifications as notifications_routes  # noqa: E402
from api.routes import push as push_routes  # noqa: E402
from api.routes import thresholds as thresholds_routes  # noqa: E402
from api.routes import health as health_routes  # noqa: E402
from api.routes import alerts as alerts_routes  # noqa: E402
from api.routes import live_status as live_status_routes  # noqa: E402
from api.routes import intervention as intervention_routes  # noqa: E402
from api.routes import chat as chat_routes  # noqa: E402
from api.routes import devices as devices_routes  # noqa: E402
from api.routes import bracelet as bracelet_routes  # noqa: E402
from api.routes import dorsi as dorsi_routes  # noqa: E402
from api.routes import guardian as guardian_routes  # noqa: E402
from api.routes import programs as programs_routes  # noqa: E402
from api.routes import reminders as reminders_routes  # noqa: E402
from api.routes import minceur as minceur_routes  # noqa: E402
from api.routes import subscriptions as subscriptions_routes  # noqa: E402
from api.routes import teleassistance as teleassistance_routes  # noqa: E402
from api.routes import pro as pro_routes  # noqa: E402
from api.routes import misc as misc_routes  # noqa: E402
from api.routes import nora_firmware as nora_firmware_routes  # noqa: E402

app = FastAPI(
    title="Chutex Care API",
    version="1.0.0",
    description="API externe Chutex Care (PostgreSQL) — Mobile + Web.",
)

allowed = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth + e-commerce + web
app.include_router(auth_routes.router, prefix="/api")
app.include_router(shop_routes.router, prefix="/api")
app.include_router(web_routes.router, prefix="/api")

# Notifications & push
app.include_router(notifications_routes.router, prefix="/api")
app.include_router(push_routes.router, prefix="/api")

# Health-related
app.include_router(thresholds_routes.router, prefix="/api")
app.include_router(health_routes.router, prefix="/api")

# Alerts / interventions / live status
app.include_router(alerts_routes.router, prefix="/api")
app.include_router(live_status_routes.router, prefix="/api")
app.include_router(intervention_routes.router, prefix="/api")

# Chat / IA
app.include_router(chat_routes.router, prefix="/api")

# Devices / bracelet / dorsi
app.include_router(devices_routes.router, prefix="/api")
app.include_router(bracelet_routes.router, prefix="/api")
app.include_router(dorsi_routes.router, prefix="/api")

# Guardian / programs / reminders / minceur
app.include_router(guardian_routes.router, prefix="/api")
app.include_router(programs_routes.router, prefix="/api")
app.include_router(reminders_routes.router, prefix="/api")
app.include_router(minceur_routes.router, prefix="/api")

# Subscriptions / contracts / plans / téléassistance
app.include_router(subscriptions_routes.router, prefix="/api")
app.include_router(teleassistance_routes.router, prefix="/api")

# Espace pro
app.include_router(pro_routes.router, prefix="/api")

# Geofences, settings, medications, RGPD, streaks
app.include_router(misc_routes.router, prefix="/api")

# Nora caches, firmware, carewatch
app.include_router(nora_firmware_routes.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
