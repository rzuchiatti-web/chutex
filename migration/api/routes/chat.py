"""Routes Chat (Nora IA + history) — version SQLAlchemy.

NOTE : la logique métier de Nora (LLM, contextes, actions) reste à porter
intégralement (services/nora_*). Pour l'instant on stocke les messages et
on appelle l'LLM de manière minimale via emergentintegrations si la clé
EMERGENT_LLM_KEY est définie.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import get_effective_role, row_to_dict, utcnow
from app.models.misc import ChatMessage

logger = logging.getLogger(__name__)
router = APIRouter()


def _today_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


@router.post("/chat/message")
async def send_chat_message(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_message = (data.get("message") or "").strip()
    if not user_message:
        return {"error": "Message vide"}

    uid = user["id"]
    role = get_effective_role(user)
    session_id = data.get("session_id", f"chat-{uid}-{role}")
    user_lang = (data.get("lang") or "FR").upper()
    lang_names = {
        "FR": "francais", "EN": "English", "DE": "Deutsch",
        "ES": "espanol", "IT": "italiano", "PT": "portugues", "NL": "Nederlands",
    }
    lang_name = lang_names.get(user_lang, "francais")

    # Save user message
    session.add(ChatMessage(
        id=str(uuid.uuid4()), user_id=uid, session_id=session_id,
        role="user", content=user_message, created_at=utcnow(),
    ))
    await session.commit()

    # Récupère 8 derniers messages d'aujourd'hui pour contexte
    res = await session.execute(
        select(ChatMessage).where(
            ChatMessage.user_id == uid,
            ChatMessage.session_id == session_id,
            ChatMessage.created_at >= _today_start(),
        ).order_by(ChatMessage.created_at.desc()).limit(10)
    )
    recent = list(reversed(res.scalars().all()))
    history_str = "\n".join(
        f"{'Patient' if m.role == 'user' else 'Coach'}: {m.content}" for m in recent[-8:]
    )

    ai_response = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
            system = (
                f"Tu es Nora, IA de Chutex specialisee en prevention et longevite. "
                f"Reponds en {lang_name}, ton serieux et factuel, max 3-4 phrases sauf "
                f"question complexe. L'app s'appelle Chutex (JAMAIS \"CareWatch\")."
            )
            chat = LlmChat(
                api_key=api_key,
                session_id=f"cx-{uuid.uuid4().hex[:8]}",
                system_message=system,
            ).with_model("openai", "gpt-5.2")
            prompt = f"Historique recent:\n{history_str}\n\nNouveau message: {user_message}"
            r = await chat.send_message(UserMessage(text=prompt))
            ai_response = (r or "").strip()
        except Exception as e:
            logger.error("Chat AI error: %s", e)

    if not ai_response:
        ai_response = "Je n'ai pas pu traiter votre question. Pourriez-vous reformuler ?"

    resp_id = str(uuid.uuid4())
    session.add(ChatMessage(
        id=resp_id, user_id=uid, session_id=session_id,
        role="assistant", content=ai_response, created_at=utcnow(),
    ))
    await session.commit()
    return {"id": resp_id, "content": ai_response, "created_at": utcnow().isoformat()}


@router.get("/chat/history")
async def get_chat_history(
    session_id: str | None = None,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = user["id"]
    role = get_effective_role(user)
    sid = session_id or f"chat-{uid}-{role}"
    res = await session.execute(
        select(ChatMessage).where(
            ChatMessage.user_id == uid,
            ChatMessage.session_id == sid,
            ChatMessage.created_at >= _today_start(),
        ).order_by(ChatMessage.created_at.asc()).limit(100)
    )
    return [row_to_dict(m) for m in res.scalars().all()]


@router.delete("/chat/clear")
async def clear_chat(
    session_id: str | None = None,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = user["id"]
    role = get_effective_role(user)
    sid = session_id or f"chat-{uid}-{role}"
    await session.execute(
        delete(ChatMessage).where(
            ChatMessage.user_id == uid, ChatMessage.session_id == sid
        )
    )
    await session.commit()
    return {"status": "cleared"}
