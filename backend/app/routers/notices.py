from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Feed, Notice, NoticeCreate

router = APIRouter(tags=["floor"])


@router.get("/feed", response_model=Feed)
def get_feed(
    as_: str = Query(
        default=store.DEFAULT_PERSONA,
        alias="as",
        description="Id of the simulated company. There is no authentication in this prototype.",
    ),
) -> dict[str, object]:
    """The floor, seen from one company: connections first, then what addresses them."""
    if store.company(as_) is None:
        raise HTTPException(status_code=404, detail=f"No company with id {as_!r}")
    return store.feed_for(as_)


@router.get("/notices", response_model=list[Notice])
def list_notices(
    kind: str | None = Query(default=None, description="need · offer"),
    sector: str | None = Query(default=None, description="textile · construction"),
    addressed_to: str | None = Query(default=None, description="A company type"),
    author: str | None = Query(default=None, description="Company id"),
) -> list[dict[str, object]]:
    return store.filter_notices(
        kind=kind, sector=sector, addressed_to=addressed_to, author=author
    )


@router.get("/notices/{notice_id}", response_model=Notice)
def get_notice(notice_id: str) -> dict[str, object]:
    record = store.notice(notice_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No notice with id {notice_id!r}")
    return record


@router.post("/notices", response_model=Notice, status_code=201)
def create_notice(payload: NoticeCreate) -> dict[str, object]:
    author = store.company(payload.author_id)
    if author is None:
        raise HTTPException(status_code=404, detail=f"No company with id {payload.author_id!r}")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="A notice needs a title")

    if payload.kind == "offer":
        if payload.product_id is None:
            raise HTTPException(status_code=400, detail="An offer must reference a product")
        product = store.product(payload.product_id)
        if product is None:
            raise HTTPException(
                status_code=404, detail=f"No product with id {payload.product_id!r}"
            )
        # A company can only put forward what it actually makes.
        if product["supplier_id"] != payload.author_id:
            raise HTTPException(
                status_code=400,
                detail="A company can only publish a product from its own catalogue",
            )

    return store.create_notice(payload.model_dump())


@router.post("/notices/{notice_id}/interest", response_model=Notice)
def express_interest(
    notice_id: str,
    as_: str = Query(default=store.DEFAULT_PERSONA, alias="as"),
) -> dict[str, object]:
    """Records interest in memory. No notification is sent to anyone."""
    record = store.express_interest(notice_id, as_)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No notice with id {notice_id!r}")
    return record
