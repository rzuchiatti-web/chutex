"""Routes Nora (caches d'analyse), Firmware (J2358), Carewatch incidents."""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import CarewatchIncident
from app.models.devices import Firmware
from app.models.misc import (
    NoraAgingAnalysisCache,
    NoraAnalysisCache,
    NoraHealthAnalysisCache,
    NoraPageAnalysisCache,
)

router = APIRouter()

FIRMWARE_DIR = "/app/firmware"
os.makedirs(FIRMWARE_DIR, exist_ok=True)


# ---------------- Nora analyses (read cache) -----------------------------
@router.get("/nora/analysis")
async def get_nora_analysis(
    cache_key: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(NoraAnalysisCache).where(NoraAnalysisCache.cache_key == cache_key)
    )
    a = res.scalar_one_or_none()
    return row_to_dict(a) if a else {"cache_key": cache_key, "analysis": None}


@router.post("/nora/analysis")
async def save_nora_analysis(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cache_key = data.get("cache_key") or f"{user['id']}-{utcnow().date().isoformat()}"
    stmt = pg_insert(NoraAnalysisCache).values(
        cache_key=cache_key, user_id=user["id"],
        date=data.get("date"), context=data.get("context"),
        analysis=data.get("analysis"),
        created_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[NoraAnalysisCache.cache_key],
        set_={"analysis": data.get("analysis"), "context": data.get("context"), "created_at": utcnow()},
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved", "cache_key": cache_key}


@router.get("/nora/health-analysis")
async def get_health_analysis(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today = utcnow().date().isoformat()
    res = await session.execute(
        select(NoraHealthAnalysisCache).where(
            NoraHealthAnalysisCache.user_id == user["id"],
            NoraHealthAnalysisCache.date == today,
        )
    )
    a = res.scalar_one_or_none()
    return row_to_dict(a) if a else {"analysis": None}


@router.get("/nora/aging-analysis")
async def get_aging_analysis(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today = utcnow().date().isoformat()
    res = await session.execute(
        select(NoraAgingAnalysisCache).where(
            NoraAgingAnalysisCache.user_id == user["id"],
            NoraAgingAnalysisCache.date == today,
        )
    )
    a = res.scalar_one_or_none()
    return row_to_dict(a) if a else {"analysis": None}


# ---------------- Firmware (J2358 V6) ------------------------------------
@router.get("/firmware/v6/latest")
async def get_latest_firmware(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(Firmware).where(
            Firmware.device_type == "bracelet_v6", Firmware.is_latest == True  # noqa: E712
        ).order_by(Firmware.id.desc()).limit(1)
    )
    fw = res.scalar_one_or_none()
    if not fw:
        return {"available": False}
    return {
        "available": True,
        "version": fw.version,
        "url": fw.url,
        "notes": fw.notes,
    }


@router.post("/firmware/v6/upload")
async def upload_firmware(
    version: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin uniquement")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Fichier trop volumineux (max 10MB)")
    filename = f"v6_{utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(FIRMWARE_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    # Mark previous as not latest
    from sqlalchemy import update
    await session.execute(
        update(Firmware).where(Firmware.device_type == "bracelet_v6").values(is_latest=False)
    )
    fw = Firmware(
        device_type="bracelet_v6",
        version=version,
        url=f"/api/firmware/v6/download/{filename}",
        notes=f"Uploaded by {user.get('name', '')}",
        is_latest=True,
        created_at=utcnow(),
    )
    session.add(fw)
    await session.commit()
    return {"status": "uploaded", "version": version, "filename": filename}


@router.get("/firmware/v6/download/{filename}")
async def download_firmware(filename: str):
    filepath = os.path.join(FIRMWARE_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(404, "Firmware non trouve")
    from starlette.responses import FileResponse
    return FileResponse(filepath, filename=filename, media_type="application/octet-stream")


# ---------------- Carewatch incidents ------------------------------------
@router.post("/carewatch/incident")
async def log_incident(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    iid = str(uuid.uuid4())
    inc = CarewatchIncident(
        id=iid,
        user_id=user["id"],
        device_mac=data.get("device_mac"),
        type=data.get("type"),
        payload=data,
        created_at=utcnow(),
    )
    session.add(inc)
    await session.commit()
    return {"status": "logged", "id": iid}


@router.get("/carewatch/incidents")
async def list_incidents(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(CarewatchIncident).where(CarewatchIncident.user_id == user["id"])
        .order_by(CarewatchIncident.created_at.desc()).limit(50)
    )
    return [row_to_dict(i) for i in res.scalars().all()]
