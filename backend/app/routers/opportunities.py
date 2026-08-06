from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Opportunity

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("", response_model=list[Opportunity])
def list_opportunities(
    sector: str | None = Query(default=None, description="textile · construction"),
    region: str | None = Query(default=None),
) -> list[dict[str, object]]:
    results = store.opportunities
    if sector:
        results = [o for o in results if o["sector"] == sector]
    if region:
        results = [o for o in results if o["region"] == region]
    return results


@router.post("/{opportunity_id}/interest", response_model=Opportunity)
def express_interest(opportunity_id: str) -> dict[str, object]:
    """Marks interest in memory. No notification is sent to anyone."""
    record = store.express_interest(opportunity_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No opportunity with id {opportunity_id!r}")
    return record
