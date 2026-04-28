"""Routes Bracelet : config, commands, status, ECG/PPG history."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.devices import BraceletCommand, Device
from app.models.health import EcgRecord

router = APIRouter()


@router.get("/bracelet/status")
async def get_bracelet_status(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Device).where(Device.user_id == user["id"], Device.type == "bracelet")
    )
    d = res.scalar_one_or_none()
    if not d:
        return {"paired": False, "connected": False, "battery": 0}
    return {
        "paired": d.paired,
        "connected": d.connected,
        "battery": d.battery or 0,
        "name": d.name or "",
        "last_sync": d.last_sync.isoformat() if d.last_sync else None,
    }


@router.post("/bracelet/unpair")
async def unpair_bracelet(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Device).where(Device.user_id == user["id"], Device.type == "bracelet")
    )
    d = res.scalar_one_or_none()
    if d:
        d.paired = False
        d.connected = False
        await session.commit()
    return {"status": "unpaired"}


@router.post("/bracelet/push")
async def push_bracelet_command(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cid = str(uuid.uuid4())
    cmd = BraceletCommand(
        id=cid, user_id=user["id"],
        command=data.get("command"),
        ble_cmd=data.get("ble_cmd"),
        ble_payload=data.get("ble_payload"),
        type=data.get("type"),
        message=data.get("message"),
        status="pending",
        created_at=utcnow(),
    )
    session.add(cmd)
    await session.commit()
    return {"status": "queued", "command_id": cid}


@router.get("/bracelet/v8/pending-commands")
@router.get("/bracelet/v6/pending-commands")
async def get_pending_commands(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(BraceletCommand).where(
            BraceletCommand.user_id == user["id"],
            BraceletCommand.status == "pending",
        ).order_by(BraceletCommand.created_at.asc()).limit(20)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.post("/bracelet/commands/{cmd_id}/ack")
async def ack_command(
    cmd_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        update(BraceletCommand)
        .where(BraceletCommand.id == cmd_id, BraceletCommand.user_id == user["id"])
        .values(status="acked")
    )
    await session.commit()
    return {"status": "acked"}


@router.get("/bracelet/v8/ecg-history")
@router.get("/bracelet/v6/ecg-history")
async def get_ecg_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(EcgRecord).where(EcgRecord.user_id == user["id"])
        .order_by(EcgRecord.timestamp.desc()).limit(30)
    )
    return [row_to_dict(e) for e in res.scalars().all()]


@router.get("/bracelet/v6/config")
@router.get("/bracelet/v8/config")
async def get_bracelet_config(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["id"],
        "tcp_host": "tcp.chutex-innovation.com",
        "tcp_port": 9001,
        "ws_host": "wss://api.chutex-innovation.com",
        "ble_active": True,
    }
