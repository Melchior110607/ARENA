from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Company, CompanyDetail

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[Company])
def list_companies(
    type: str | None = Query(default=None, description="brand · supplier · manufacturer · processor · raw_material_producer"),
    sector: str | None = Query(default=None, description="textile · construction"),
    country: str | None = Query(default=None, description="ISO 3166-1 alpha-2"),
    chain_position: str | None = Query(default=None),
    product_type: str | None = Query(default=None),
    material: str | None = Query(default=None),
    certification: str | None = Query(default=None),
    q: str | None = Query(default=None, description="Free-text search"),
) -> list[dict[str, object]]:
    return store.filter_companies(
        type=type,
        sector=sector,
        country=country,
        chain_position=chain_position,
        product_type=product_type,
        material=material,
        certification=certification,
        q=q,
    )


@router.get("/{company_id}", response_model=CompanyDetail)
def get_company(company_id: str) -> dict[str, object]:
    company = store.company(company_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"No company with id {company_id!r}")

    network = [c for c in (store.company(cid) for cid in company["connections"]) if c is not None]
    return {
        "company": company,
        "products": store.products_of(company_id),
        "network": network,
    }
