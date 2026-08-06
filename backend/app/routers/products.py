from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Product, ProductDetail, TraceabilityChain

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[Product])
def list_products(
    category: str | None = Query(default=None),
    material: str | None = Query(default=None),
    country: str | None = Query(default=None, description="ISO 3166-1 alpha-2"),
    supplier: str | None = Query(default=None, description="Company id"),
    certification: str | None = Query(default=None),
    sector: str | None = Query(default=None, description="textile · construction"),
    q: str | None = Query(default=None, description="Free-text search"),
) -> list[dict[str, object]]:
    return store.filter_products(
        category=category,
        material=material,
        country=country,
        supplier=supplier,
        certification=certification,
        sector=sector,
        q=q,
    )


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: str) -> dict[str, object]:
    product = store.product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail=f"No product with id {product_id!r}")

    supplier = store.company(product["supplier_id"])
    if supplier is None:
        raise HTTPException(status_code=500, detail="Product references an unknown supplier")

    return {
        "product": product,
        "supplier": supplier,
        "has_traceability": store.chain_for_product(product_id) is not None,
    }


@router.get("/{product_id}/traceability", response_model=TraceabilityChain)
def get_traceability(product_id: str) -> dict[str, object]:
    chain = store.chain_for_product(product_id)
    if chain is None:
        raise HTTPException(
            status_code=404,
            detail=f"No traceability chain published for product {product_id!r}",
        )
    return chain
