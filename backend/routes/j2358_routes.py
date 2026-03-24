"""
J2358 V6 Bracelet — Firmware management & device registration HTTP routes
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from datetime import datetime, timezone
from database import db
from auth import get_current_user
import uuid
import os

router = APIRouter()
FIRMWARE_DIR = "/app/backend/firmware"
os.makedirs(FIRMWARE_DIR, exist_ok=True)


@router.post("/firmware/v6/upload")
async def upload_v6_firmware(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload a firmware file for J2358 V6 OTA updates. Admin only."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10MB)")

    filename = f"v6_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(FIRMWARE_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    fw_doc = {
        "id": str(uuid.uuid4()),
        "filename": filename,
        "original_name": file.filename,
        "size_bytes": len(content),
        "device_type": "bracelet_v6",
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "filepath": filepath,
    }
    await db.firmware.insert_one(fw_doc)

    return {
        "id": fw_doc["id"],
        "filename": filename,
        "size_bytes": len(content),
        "download_url": f"/api/firmware/v6/download/{filename}",
    }


@router.get("/firmware/v6/latest")
async def get_latest_v6_firmware():
    """Get the latest V6 firmware info (used by the device for OTA check)."""
    fw = await db.firmware.find_one(
        {"device_type": "bracelet_v6"}, {"_id": 0},
        sort=[("uploaded_at", -1)]
    )
    if not fw:
        return {"available": False}
    return {
        "available": True,
        "filename": fw["filename"],
        "size_bytes": fw["size_bytes"],
        "download_url": f"/api/firmware/v6/download/{fw['filename']}",
        "uploaded_at": fw["uploaded_at"],
    }


@router.get("/firmware/v6/download/{filename}")
async def download_v6_firmware(filename: str):
    """Download a firmware file. Used by the bracelet for OTA."""
    filepath = os.path.join(FIRMWARE_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Firmware non trouve")
    from starlette.responses import FileResponse
    return FileResponse(filepath, filename=filename, media_type="application/octet-stream")


@router.post("/devices/v6/register")
async def register_v6_device(data: dict, user=Depends(get_current_user)):
    """Register a J2358 V6 bracelet for a user. Links IMEI to user_id."""
    imei = data.get("imei", "").strip()
    if not imei or len(imei) < 10:
        raise HTTPException(status_code=400, detail="IMEI invalide")

    existing = await db.devices.find_one({"imei": imei}, {"_id": 0})
    if existing and existing.get("user_id") != user["id"]:
        raise HTTPException(status_code=409, detail="Ce bracelet est deja associe a un autre utilisateur")

    now = datetime.now(timezone.utc).isoformat()
    if existing:
        await db.devices.update_one({"imei": imei}, {"$set": {"user_id": user["id"], "last_sync": now}})
    else:
        await db.devices.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "device_type": "bracelet_v6",
            "imei": imei,
            "name": data.get("name", "Bracelet V6 4G"),
            "connected": False,
            "battery": 0,
            "last_sync": now,
            "created_at": now,
            "firmware_version": "",
        })

    return {"status": "ok", "imei": imei, "message": f"Bracelet V6 enregistre pour {user.get('name', 'utilisateur')}"}


@router.get("/devices/v6/status")
async def get_v6_status(user=Depends(get_current_user)):
    """Get the status of the user's V6 bracelet."""
    device = await db.devices.find_one(
        {"user_id": user["id"], "device_type": "bracelet_v6"}, {"_id": 0}
    )
    if not device:
        return {"registered": False}
    return {
        "registered": True,
        "imei": device.get("imei", ""),
        "connected": device.get("connected", False),
        "battery": device.get("battery", 0),
        "last_sync": device.get("last_sync", ""),
        "firmware_version": device.get("firmware_version", ""),
        "last_location": device.get("last_location", None),
    }


@router.get("/tcp/status")
async def tcp_server_status():
    """Check if the J2358 TCP server is running."""
    import socket
    tcp_port = int(os.environ.get("J2358_TCP_PORT", "9001"))
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex(('127.0.0.1', tcp_port))
        s.close()
        running = result == 0
    except:
        running = False

    return {
        "tcp_server": "running" if running else "stopped",
        "port": tcp_port,
        "protocol": "J2358",
        "device": "Bracelet V6 4G",
    }
