from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Relationship, RelationshipCreate, RelationshipUpdate

router = APIRouter(prefix="/relationships", tags=["relationships"])


@router.get("", response_model=list[Relationship])
def list_relationships(
    as_: str = Query(
        default=store.DEFAULT_PERSONA,
        alias="as",
        description="Id of the simulated company — the owner of this pipeline.",
    ),
) -> list[dict[str, object]]:
    if store.company(as_) is None:
        raise HTTPException(status_code=404, detail=f"No company with id {as_!r}")
    return store.relationships_for(as_)


@router.post("", response_model=Relationship, status_code=201)
def create_relationship(payload: RelationshipCreate) -> dict[str, object]:
    if store.company(payload.owner_id) is None or store.company(payload.company_id) is None:
        raise HTTPException(status_code=404, detail="Unknown company in relationship")
    return store.create_relationship(
        payload.owner_id, payload.company_id, payload.status, payload.note
    )


@router.patch("/{relationship_id}", response_model=Relationship)
def update_relationship(relationship_id: str, payload: RelationshipUpdate) -> dict[str, object]:
    record = store.update_relationship(relationship_id, payload.status)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No relationship with id {relationship_id!r}")
    return record
