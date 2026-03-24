from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from auth import get_current_user

router = APIRouter()

async def _emit_team_activity(user_id: str, user_name: str, program_id: str, action_type: str, detail: str = "", icon: str = "ri-check-line", color: str = "#10B981"):
    """Record a team activity event for the social feed."""
    team = await db.team_programs.find_one(
        {"members.user_id": user_id, "program_id": program_id, "status": {"$in": ["waiting", "active"]}}, {"_id": 0, "id": 1, "members": 1}
    )
    if not team or len(team.get("members", [])) < 2:
        return
    await db.team_activity_feed.insert_one({
        "id": str(uuid.uuid4()),
        "team_id": team["id"],
        "user_id": user_id,
        "user_name": user_name,
        "program_id": program_id,
        "action_type": action_type,
        "detail": detail,
        "icon": icon,
        "color": color,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@router.get("/programs/team/feed")
async def team_activity_feed(user=Depends(get_current_user)):
    """Get recent team activity feed for social notifications."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"feed": []}

    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "program_id": enrollment["program_id"], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    if not team:
        return {"feed": []}

    # Get last 20 activities from team (excluding the current user)
    activities = await db.team_activity_feed.find(
        {"team_id": team["id"], "user_id": {"$ne": user['id']}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)

    return {"feed": activities}


@router.get("/programs/team/leaderboard")
async def team_leaderboard(user=Depends(get_current_user)):
    """Get team leaderboard for active program."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"leaderboard": []}

    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "program_id": enrollment["program_id"], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    if not team:
        return {"leaderboard": []}

    leaderboard = []
    for m in team.get("members", []):
        # Count total checkins for this member
        checkins = await db.program_checkins.count_documents({"user_id": m["user_id"], "program_id": enrollment["program_id"]})
        # Count total tasks done
        task_docs = await db.program_task_progress.find({"user_id": m["user_id"]}).to_list(100)
        total_tasks = sum(len(d.get("tasks_done_indices", [])) for d in task_docs)
        # Calculate streak (consecutive days)
        streak = 0
        today = datetime.now(timezone.utc).date()
        for d in range(30):
            check_date = (today - timedelta(days=d)).isoformat()
            has = await db.program_checkins.find_one({"user_id": m["user_id"], "date": check_date})
            if has:
                streak += 1
            else:
                if d > 0: break

        leaderboard.append({
            "name": m["name"],
            "user_id": m["user_id"],
            "is_me": m["user_id"] == user['id'],
            "checkins": checkins,
            "tasks_done": total_tasks,
            "streak": streak,
            "score": checkins * 10 + total_tasks * 5 + streak * 15,
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    for i, m in enumerate(leaderboard):
        m["rank"] = i + 1

    return {"leaderboard": leaderboard, "team_id": team["id"], "invite_code": team["invite_code"]}


@router.post("/programs/team/create")
async def create_team_program(data: dict, user=Depends(get_current_user)):
    """Create a team program and get invite code"""
    if user.get("role") != "beneficiary" and user.get("active_role") != "beneficiary":
        raise HTTPException(status_code=403, detail="Seuls les beneficiaires peuvent creer un programme en equipe")

    program_id = data.get("program_id")
    start_date = data.get("start_date")  # ISO date string "2026-02-25"
    if not program_id or not start_date:
        raise HTTPException(status_code=400, detail="program_id et start_date requis")

    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    invite_code = uuid.uuid4().hex[:8].upper()
    team = {
        "id": str(uuid.uuid4()),
        "invite_code": invite_code,
        "program_id": program_id,
        "start_date": start_date,
        "created_by": user['id'],
        "members": [{"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}],
        "status": "waiting",  # waiting, active, completed
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.team_programs.insert_one(team)
    return {"team_id": team["id"], "invite_code": invite_code, "program": {"title": program["title"], "duration_days": program["duration_days"]}, "start_date": start_date}


@router.post("/programs/team/join")
async def join_team_program(data: dict, user=Depends(get_current_user)):
    """Join a team program with invite code"""
    if user.get("role") != "beneficiary" and user.get("active_role") != "beneficiary":
        raise HTTPException(status_code=403, detail="Seuls les beneficiaires peuvent rejoindre un programme en equipe")

    invite_code = data.get("invite_code", "").strip().upper()
    if not invite_code:
        raise HTTPException(status_code=400, detail="Code d'invitation requis")

    team = await db.team_programs.find_one({"invite_code": invite_code}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Code d'invitation invalide")
    if team.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Ce programme est deja termine")

    # Check if already member
    member_ids = [m["user_id"] for m in team.get("members", [])]
    if user['id'] in member_ids:
        raise HTTPException(status_code=400, detail="Tu fais deja partie de cette equipe")
    if len(member_ids) >= 5:
        raise HTTPException(status_code=400, detail="L'equipe est complete (5 max)")

    await db.team_programs.update_one(
        {"id": team["id"]},
        {"$push": {"members": {"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}}}
    )

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    creator = next((m for m in team["members"] if m["user_id"] == team["created_by"]), None)
    return {
        "status": "joined", "team_id": team["id"],
        "program": {"title": program["title"] if program else "Programme", "duration_days": program["duration_days"] if program else 0},
        "start_date": team["start_date"],
        "creator_name": creator["name"] if creator else "Quelqu'un",
        "members_count": len(member_ids) + 1,
    }


@router.get("/programs/team/active")
async def get_active_team(user=Depends(get_current_user)):
    """Get active team program with all members progress"""
    team = await db.team_programs.find_one(
        {"members.user_id": user['id'], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
    )
    if not team:
        return {"has_team": False}

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})

    # Calculate day based on start_date
    try:
        start = datetime.fromisoformat(team["start_date"])
        days_since = (datetime.now(timezone.utc) - start).days + 1
        if days_since < 1:
            # Program hasn't started yet
            days_until = abs(days_since) + 1
            return {
                "has_team": True, "status": "waiting",
                "team_id": team["id"], "invite_code": team["invite_code"],
                "program": {"title": program["title"] if program else "", "icon": program.get("icon", ""), "color": program.get("color", "#A78BFA"), "duration_days": program.get("duration_days", 21)} if program else {},
                "start_date": team["start_date"], "days_until_start": days_until,
                "members": [{"name": m["name"], "user_id": m["user_id"]} for m in team.get("members", [])],
            }
        current_day = min(days_since, program["duration_days"] if program else 30)
    except:
        current_day = 1

    # Activate if still waiting
    if team.get("status") == "waiting":
        await db.team_programs.update_one({"id": team["id"]}, {"$set": {"status": "active"}})

    # Get each member's progress
    members_progress = []
    for m in team.get("members", []):
        # Count their checkins
        checkins = await db.program_checkins.find(
            {"user_id": m["user_id"]}, {"_id": 0}
        ).to_list(100)
        recent_moods = [c.get("mood", 3) for c in checkins[-7:] if c.get("mood")]
        members_progress.append({
            "name": m["name"], "user_id": m["user_id"],
            "checkins_count": len(checkins),
            "avg_mood": round(sum(recent_moods) / len(recent_moods), 1) if recent_moods else 0,
            "is_me": m["user_id"] == user['id'],
        })

    return {
        "has_team": True, "status": "active",
        "team_id": team["id"], "invite_code": team["invite_code"],
        "program": {"title": program["title"] if program else "", "icon": program.get("icon", ""), "color": program.get("color", "#A78BFA"), "duration_days": program.get("duration_days", 21)} if program else {},
        "start_date": team["start_date"], "current_day": current_day,
        "progress_pct": round((current_day / (program["duration_days"] if program else 21)) * 100),
        "members": members_progress,
    }



@router.post("/programs/team/invite-by-phone")
async def invite_to_team_by_phone(data: dict, user=Depends(get_current_user)):
    """Invite someone to a team program by phone number.
    If the phone belongs to an existing beneficiary → in-app notification.
    If not → send SMS invitation."""
    phone = data.get("phone", "").strip()
    team_id = data.get("team_id", "").strip()
    if not phone or not team_id:
        raise HTTPException(status_code=400, detail="phone et team_id requis")

    team = await db.team_programs.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Equipe non trouvee")
    if team.get("created_by") != user['id']:
        # Allow any member to invite
        member_ids = [m["user_id"] for m in team.get("members", [])]
        if user['id'] not in member_ids:
            raise HTTPException(status_code=403, detail="Vous ne faites pas partie de cette equipe")

    # Normalize phone
    cleaned = phone.replace("+", "").replace(" ", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "33" + cleaned[1:]
    if not cleaned.startswith("33"):
        cleaned = "33" + cleaned

    # Check if phone belongs to an existing beneficiary
    phone_variants = [f"+{cleaned}", cleaned, f"0{cleaned[2:]}" if cleaned.startswith("33") else cleaned]
    existing_user = None
    for pv in phone_variants:
        existing_user = await db.users.find_one({"phone": pv, "role": "beneficiary"}, {"_id": 0})
        if existing_user:
            break

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    program_title = program.get("title", "Programme") if program else "Programme"

    if existing_user:
        # Check if already a member
        member_ids = [m["user_id"] for m in team.get("members", [])]
        if existing_user['id'] in member_ids:
            return {"status": "already_member", "message": f"{existing_user.get('name', 'Cet utilisateur')} fait deja partie de l'equipe."}

        # Create in-app notification
        invite_id = str(uuid.uuid4())
        await db.team_invitations.insert_one({
            "id": invite_id,
            "team_id": team_id,
            "invite_code": team["invite_code"],
            "inviter_id": user['id'],
            "inviter_name": user.get("name", ""),
            "invitee_id": existing_user['id'],
            "invitee_phone": phone,
            "program_id": team["program_id"],
            "program_title": program_title,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {
            "status": "notification_sent",
            "method": "in_app",
            "message": f"Invitation envoyee a {existing_user.get('name', 'l utilisateur')}. Il/elle recevra une notification dans l'application.",
            "invitee_name": existing_user.get("name", ""),
        }
    else:
        # Send SMS
        from services.smsmode_service import send_sms
        sms_text = f"{user.get('name', 'Un ami')} vous invite a faire le programme '{program_title}' ensemble sur Chutex. Code equipe: {team['invite_code']}. Telechargez l'app Chutex pour rejoindre."
        sms_sent = await send_sms(cleaned, sms_text)
        return {
            "status": "sms_sent" if sms_sent else "sms_failed",
            "method": "sms",
            "message": f"SMS d'invitation envoye au {phone}." if sms_sent else "Impossible d'envoyer le SMS. Partagez le code manuellement.",
            "invite_code": team["invite_code"],
        }


@router.get("/programs/team/invitations")
async def get_team_invitations(user=Depends(get_current_user)):
    """Get pending team program invitations for the current user"""
    invitations = await db.team_invitations.find(
        {"invitee_id": user['id'], "status": "pending"}, {"_id": 0}
    ).to_list(20)
    return invitations


@router.post("/programs/team/invitations/{invite_id}/accept")
async def accept_team_invitation(invite_id: str, user=Depends(get_current_user)):
    """Accept a team program invitation"""
    invite = await db.team_invitations.find_one({"id": invite_id, "invitee_id": user['id']}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation non trouvee")

    team = await db.team_programs.find_one({"id": invite["team_id"]}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Equipe non trouvee")

    # Add user to team
    member_ids = [m["user_id"] for m in team.get("members", [])]
    if user['id'] not in member_ids:
        await db.team_programs.update_one(
            {"id": team["id"]},
            {"$push": {"members": {"user_id": user['id'], "name": user.get("name", ""), "joined_at": datetime.now(timezone.utc).isoformat(), "enrollment_id": None}}}
        )

    # Mark invitation as accepted
    await db.team_invitations.update_one({"id": invite_id}, {"$set": {"status": "accepted"}})

    program = await db.programs.find_one({"id": team["program_id"]}, {"_id": 0})
    return {
        "status": "joined",
        "team_id": team["id"],
        "invite_code": team["invite_code"],
        "program_title": program.get("title", "") if program else "",
    }


@router.post("/programs/team/invitations/{invite_id}/reject")
async def reject_team_invitation(invite_id: str, user=Depends(get_current_user)):
    """Reject a team program invitation"""
    await db.team_invitations.update_one(
        {"id": invite_id, "invitee_id": user['id']},
        {"$set": {"status": "rejected"}}
    )
    return {"status": "rejected"}
