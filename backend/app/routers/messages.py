from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Conversation, Message, MessageCreate

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=list[Conversation])
def list_conversations(
    as_: str = Query(
        default=store.DEFAULT_PERSONA,
        alias="as",
        description="Id of the simulated company.",
    ),
) -> list[dict[str, object]]:
    if store.company(as_) is None:
        raise HTTPException(status_code=404, detail=f"No company with id {as_!r}")
    return store.conversations_for(as_)


@router.get("/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str) -> dict[str, object]:
    convo = store.conversation(conversation_id)
    if convo is None:
        raise HTTPException(status_code=404, detail=f"No conversation with id {conversation_id!r}")
    return convo


@router.post("", response_model=Message, status_code=201)
def send_message(payload: MessageCreate) -> dict[str, object]:
    """Adds a message to the in-memory thread. Nothing is sent to a real company."""
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Message body is empty")
    message = store.add_message(payload.conversation_id, payload.from_id, payload.body.strip())
    if message is None:
        raise HTTPException(
            status_code=404, detail=f"No conversation with id {payload.conversation_id!r}"
        )
    return message
