from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Connection, ConnectionCreate, ConnectionsView, ConnectionUpdate

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=ConnectionsView)
def list_connections(
    as_: str = Query(
        default=store.DEFAULT_PERSONA,
        alias="as",
        description="Id of the simulated company. There is no authentication in this prototype.",
    ),
) -> dict[str, object]:
    if store.company(as_) is None:
        raise HTTPException(status_code=404, detail=f"No company with id {as_!r}")
    return store.connections_view(as_)


@router.post("", response_model=Connection, status_code=201)
def create_connection(payload: ConnectionCreate) -> dict[str, object]:
    if store.company(payload.from_id) is None or store.company(payload.to_id) is None:
        raise HTTPException(status_code=404, detail="Unknown company in connection request")
    if payload.from_id == payload.to_id:
        raise HTTPException(status_code=400, detail="A company cannot connect to itself")
    return store.create_connection(payload.from_id, payload.to_id, payload.message)


@router.patch("/{connection_id}", response_model=Connection)
def update_connection(connection_id: str, payload: ConnectionUpdate) -> dict[str, object]:
    record = store.update_connection(connection_id, payload.status)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No connection with id {connection_id!r}")
    return record
