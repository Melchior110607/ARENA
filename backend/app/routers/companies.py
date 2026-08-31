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
    min_score: int | None = Query(default=None, description="Minimum RSE score, 0-100"),
    q: str | None = Query(default=None, description="Free-text search"),
    as_: str | None = Query(
        default=None,
        alias="as",
        description="Viewer's company id. Governs disclosure of confidential members.",
    ),
) -> list[dict[str, object]]:
    results = store.filter_companies(
        type=type,
        sector=sector,
        country=country,
        chain_position=chain_position,
        product_type=product_type,
        material=material,
        certification=certification,
        min_score=min_score,
        q=q,
    )
    return store.mask_companies(results, as_)


@router.get("/{company_id}", response_model=CompanyDetail)
def get_company(
    company_id: str,
    as_: str | None = Query(
        default=None,
        alias="as",
        description="Viewer's company id. Governs disclosure of confidential members.",
    ),
) -> dict[str, object]:
    company = store.company(company_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"No company with id {company_id!r}")

    network = [c for c in (store.company(cid) for cid in company["connections"]) if c is not None]
    return {
        "company": store.mask_company(company, as_),
        "products": store.products_of(company_id),
        "network": store.mask_companies(network, as_),
    }
