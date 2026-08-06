from fastapi import APIRouter

from .. import store
from ..models import Company, Facets

router = APIRouter(tags=["meta"])


@router.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "data": "fictional",
        "companies": len(store.companies),
        "products": len(store.products),
        "traceability_chains": len(store.chains),
        "notices": len(store.notices),
    }


@router.get("/filters", response_model=Facets)
def filters() -> dict[str, object]:
    """Facet values with live counts, so filter controls can show what a choice yields."""
    return store.facets()


@router.get("/personas", response_model=list[Company])
def personas() -> list[dict[str, object]]:
    """Companies a visitor can navigate as. There is no authentication in this prototype."""
    return store.personas()
