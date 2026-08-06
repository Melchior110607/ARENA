"""In-memory data store for the Arena prototype.

JSON files are read once at import time into plain Python structures. Mutations
(connection requests, messages, pipeline moves, opportunity interest) change that
in-process state and are lost when the process restarts. That is deliberate: the
prototype has no database, and pretending otherwise would misrepresent what has
been built.
"""

from __future__ import annotations

import json
import itertools
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any, Iterable

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# The company a visitor navigates as when they have not picked one yet.
DEFAULT_PERSONA = "maison-vaudoise"

# Personas offered in the header switcher: the two brands, plus one supplier-side
# company so the demo can show the network from the other end of the chain.
PERSONA_IDS = ["maison-vaudoise", "atelier-romand-construction", "confeccoes-douro"]

COMPANY_TYPE_LABELS = {
    "brand": "Brand",
    "supplier": "Supplier",
    "manufacturer": "Manufacturer",
    "processor": "Processor",
    "raw_material_producer": "Raw material producer",
}

CHAIN_POSITION_LABELS = {
    "raw_material": "Raw material",
    "processing": "Processing",
    "manufacturing": "Manufacturing",
    "distribution": "Distribution",
    "brand": "Brand",
}

CHAIN_POSITION_ORDER = list(CHAIN_POSITION_LABELS)

SECTOR_LABELS = {"textile": "Textile", "construction": "Construction"}

ALL_COMPANY_TYPES = list(COMPANY_TYPE_LABELS)


def _load(name: str) -> list[dict[str, Any]]:
    with (DATA_DIR / f"{name}.json").open(encoding="utf-8") as handle:
        return json.load(handle)


companies: list[dict[str, Any]] = _load("companies")
products: list[dict[str, Any]] = _load("products")
chains: list[dict[str, Any]] = _load("traceability")
connections: list[dict[str, Any]] = _load("connections")
conversations: list[dict[str, Any]] = _load("conversations")
notices: list[dict[str, Any]] = _load("notices")

_id_counter = itertools.count(1)


def _next_id(prefix: str) -> str:
    return f"{prefix}-{next(_id_counter):04d}"


def _today() -> str:
    return date.today().isoformat()


# --------------------------------------------------------------------------- #
# Lookups
# --------------------------------------------------------------------------- #


def company(company_id: str) -> dict[str, Any] | None:
    return next((c for c in companies if c["id"] == company_id), None)


def product(product_id: str) -> dict[str, Any] | None:
    return next((p for p in products if p["id"] == product_id), None)


def chain(chain_id: str) -> dict[str, Any] | None:
    return next((c for c in chains if c["id"] == chain_id), None)


def chain_for_product(product_id: str) -> dict[str, Any] | None:
    return next((c for c in chains if c["product_id"] == product_id), None)


def products_of(company_id: str) -> list[dict[str, Any]]:
    return [p for p in products if p["supplier_id"] == company_id]


def conversation(conversation_id: str) -> dict[str, Any] | None:
    return next((c for c in conversations if c["id"] == conversation_id), None)


def notice(notice_id: str) -> dict[str, Any] | None:
    return next((n for n in notices if n["id"] == notice_id), None)


def personas() -> list[dict[str, Any]]:
    return [c for c in companies if c["id"] in PERSONA_IDS]


# --------------------------------------------------------------------------- #
# Filtering
# --------------------------------------------------------------------------- #


def _matches_text(haystacks: Iterable[str], needle: str) -> bool:
    needle = needle.lower().strip()
    return any(needle in (value or "").lower() for value in haystacks)


def filter_companies(
    *,
    type: str | None = None,
    sector: str | None = None,
    country: str | None = None,
    chain_position: str | None = None,
    product_type: str | None = None,
    material: str | None = None,
    certification: str | None = None,
    q: str | None = None,
) -> list[dict[str, Any]]:
    results = companies

    if type:
        results = [c for c in results if c["type"] == type]
    if sector:
        results = [c for c in results if c["sector"] == sector]
    if country:
        results = [c for c in results if c["country"] == country]
    if chain_position:
        results = [c for c in results if c["chain_position"] == chain_position]
    if product_type:
        results = [c for c in results if product_type in c["capabilities"]["product_types"]]
    if material:
        results = [c for c in results if material in c["capabilities"]["materials"]]
    if certification:
        results = [c for c in results if certification in c["capabilities"]["certifications"]]
    if q:
        results = [
            c
            for c in results
            if _matches_text(
                [
                    c["name"],
                    c["tagline"],
                    c["description"],
                    c["subsector"],
                    c["city"],
                    c["country_name"],
                    *c["capabilities"]["product_types"],
                    *c["capabilities"]["materials"],
                ],
                q,
            )
        ]

    return results


def filter_products(
    *,
    category: str | None = None,
    material: str | None = None,
    country: str | None = None,
    supplier: str | None = None,
    certification: str | None = None,
    sector: str | None = None,
    q: str | None = None,
) -> list[dict[str, Any]]:
    results = products

    if category:
        results = [p for p in results if p["category"] == category]
    if material:
        results = [p for p in results if material in p["materials"] or p["material"] == material]
    if country:
        results = [p for p in results if p["country"] == country]
    if supplier:
        results = [p for p in results if p["supplier_id"] == supplier]
    if certification:
        results = [p for p in results if certification in p["certifications"]]
    if sector:
        results = [p for p in results if p["sector"] == sector]
    if q:
        results = [
            p
            for p in results
            if _matches_text(
                [p["name"], p["description"], p["category"], p["material"], *p["applications"]],
                q,
            )
        ]

    return results


# --------------------------------------------------------------------------- #
# Facets — live counts for the filter controls
# --------------------------------------------------------------------------- #


def _facet(counter: Counter[str], labels: dict[str, str] | None = None) -> list[dict[str, Any]]:
    return [
        {"value": value, "label": (labels or {}).get(value, value), "count": count}
        for value, count in sorted(counter.items(), key=lambda item: (-item[1], item[0]))
    ]


def facets() -> dict[str, Any]:
    country_labels = {c["country"]: c["country_name"] for c in companies}
    country_labels.update({p["country"]: p["country_name"] for p in products})
    supplier_labels = {c["id"]: c["name"] for c in companies}

    return {
        "company_types": _facet(Counter(c["type"] for c in companies), COMPANY_TYPE_LABELS),
        "sectors": _facet(Counter(c["sector"] for c in companies), SECTOR_LABELS),
        "countries": _facet(Counter(c["country"] for c in companies), country_labels),
        "chain_positions": _facet(
            Counter(c["chain_position"] for c in companies), CHAIN_POSITION_LABELS
        ),
        "product_types": _facet(
            Counter(t for c in companies for t in c["capabilities"]["product_types"])
        ),
        "materials": _facet(
            Counter(m for c in companies for m in c["capabilities"]["materials"])
        ),
        "certifications": _facet(
            Counter(x for c in companies for x in c["capabilities"]["certifications"])
        ),
        "product_categories": _facet(Counter(p["category"] for p in products)),
        "product_materials": _facet(Counter(m for p in products for m in p["materials"])),
        "product_countries": _facet(Counter(p["country"] for p in products), country_labels),
        "product_certifications": _facet(
            Counter(x for p in products for x in p["certifications"])
        ),
        "suppliers": _facet(Counter(p["supplier_id"] for p in products), supplier_labels),
    }


# --------------------------------------------------------------------------- #
# Connections
# --------------------------------------------------------------------------- #


def _connected_ids(company_id: str) -> set[str]:
    linked: set[str] = set()
    for conn in connections:
        if conn["status"] != "accepted":
            continue
        if conn["from_id"] == company_id:
            linked.add(conn["to_id"])
        elif conn["to_id"] == company_id:
            linked.add(conn["from_id"])
    return linked


def _pending_ids(company_id: str) -> set[str]:
    pending: set[str] = set()
    for conn in connections:
        if conn["status"] != "pending":
            continue
        if conn["from_id"] == company_id:
            pending.add(conn["to_id"])
        elif conn["to_id"] == company_id:
            pending.add(conn["from_id"])
    return pending


def suggestions_for(company_id: str, limit: int = 6) -> list[str]:
    """Rank unconnected companies by how well they complete the persona's chain.

    Deliberately simple and explainable — this is a prototype, not a
    recommendation engine, and the cahier des charges rules out AI matching.
    """
    me = company(company_id)
    if me is None:
        return []

    excluded = _connected_ids(company_id) | _pending_ids(company_id) | {company_id}
    my_position = CHAIN_POSITION_ORDER.index(me["chain_position"])

    def score(other: dict[str, Any]) -> tuple[int, int, str]:
        points = 0
        if other["sector"] == me["sector"]:
            points += 3
        shared_materials = set(other["capabilities"]["materials"]) & set(
            me["capabilities"]["materials"]
        )
        points += min(len(shared_materials), 3)
        # Favour companies upstream of the persona: that is who a brand needs.
        distance = my_position - CHAIN_POSITION_ORDER.index(other["chain_position"])
        if distance > 0:
            points += 2
        if other["region"] in me["regions_served"]:
            points += 1
        return (-points, abs(distance), other["name"])

    candidates = [c for c in companies if c["id"] not in excluded]
    return [c["id"] for c in sorted(candidates, key=score)[:limit]]


def connections_view(company_id: str) -> dict[str, Any]:
    accepted = [
        c
        for c in connections
        if c["status"] == "accepted" and company_id in (c["from_id"], c["to_id"])
    ]
    incoming = [c for c in connections if c["status"] == "pending" and c["to_id"] == company_id]
    outgoing = [c for c in connections if c["status"] == "pending" and c["from_id"] == company_id]
    return {
        "accepted": accepted,
        "incoming": incoming,
        "outgoing": outgoing,
        "suggestions": suggestions_for(company_id),
    }


def create_connection(
    from_id: str,
    to_id: str,
    message: str = "",
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    existing = next(
        (
            c
            for c in connections
            if {c["from_id"], c["to_id"]} == {from_id, to_id} and c["status"] != "declined"
        ),
        None,
    )
    if existing is not None:
        return existing

    record = {
        "id": _next_id("conn"),
        "from_id": from_id,
        "to_id": to_id,
        "status": "pending",
        "created_at": _today(),
        "responded_at": None,
        "message": message,
        "context": context,
        "conversation_id": None,
    }
    connections.append(record)
    return record


def update_connection(connection_id: str, status: str) -> dict[str, Any] | None:
    record = next((c for c in connections if c["id"] == connection_id), None)
    if record is None:
        return None

    record["status"] = status
    record["responded_at"] = _today()

    # Accepting is the whole point: the two companies are now connected and can
    # talk. Opening the conversation here is what makes that true — otherwise
    # accepting leads nowhere.
    if status == "accepted" and record.get("conversation_id") is None:
        convo = open_conversation(
            record["from_id"],
            record["to_id"],
            record.get("context"),
            first_message=record.get("message") or "",
            first_message_from=record["from_id"],
        )
        record["conversation_id"] = convo["id"]

    return record


# --------------------------------------------------------------------------- #
# Messages
# --------------------------------------------------------------------------- #


def conversations_for(company_id: str) -> list[dict[str, Any]]:
    return [c for c in conversations if company_id in c["participants"]]


def _default_context(other_id: str) -> dict[str, Any]:
    other = company(other_id)
    return {
        "type": "company",
        "id": other_id,
        "label": other["name"] if other else other_id,
    }


def open_conversation(
    a_id: str,
    b_id: str,
    context: dict[str, Any] | None = None,
    first_message: str = "",
    first_message_from: str | None = None,
) -> dict[str, Any]:
    """Open a thread between two companies, or return the one that already exists."""
    existing = next(
        (c for c in conversations if set(c["participants"]) == {a_id, b_id}),
        None,
    )
    if existing is not None:
        return existing

    convo: dict[str, Any] = {
        "id": _next_id("conv"),
        "participants": [a_id, b_id],
        "context": context or _default_context(b_id),
        "messages": [],
    }
    conversations.append(convo)

    # The request's own note becomes the first thing said — the conversation
    # starts where the request started.
    if first_message.strip():
        convo["messages"].append(
            {
                "id": _next_id("msg"),
                "from_id": first_message_from or a_id,
                "body": first_message.strip(),
                "sent_at": f"{_today()}T00:00:00Z",
            }
        )
    return convo


def add_message(conversation_id: str, from_id: str, body: str) -> dict[str, Any] | None:
    convo = conversation(conversation_id)
    if convo is None:
        return None
    message = {
        "id": _next_id("msg"),
        "from_id": from_id,
        "body": body,
        "sent_at": f"{_today()}T00:00:00Z",
    }
    convo["messages"].append(message)
    return message


# --------------------------------------------------------------------------- #
# Notices and the floor
# --------------------------------------------------------------------------- #


def filter_notices(
    *,
    kind: str | None = None,
    sector: str | None = None,
    addressed_to: str | None = None,
    author: str | None = None,
) -> list[dict[str, Any]]:
    results = notices
    if kind:
        results = [n for n in results if n["kind"] == kind]
    if sector:
        results = [n for n in results if n.get("sector") in (sector, None)]
    if addressed_to:
        results = [n for n in results if addressed_to in n["addressed_to"]]
    if author:
        results = [n for n in results if n["author_id"] == author]
    return sorted(results, key=lambda n: n["posted_at"], reverse=True)


def create_notice(payload: dict[str, Any]) -> dict[str, Any]:
    record = {
        "id": _next_id("notice"),
        "posted_at": _today(),
        "interested_by": [],
        **payload,
    }
    notices.append(record)
    return record


def express_interest(notice_id: str, company_id: str) -> dict[str, Any] | None:
    record = notice(notice_id)
    if record is None:
        return None
    if company_id not in record["interested_by"]:
        record["interested_by"].append(company_id)
    return record


def _notice_score(item: dict[str, Any], me: dict[str, Any]) -> tuple[int, str]:
    """How strongly a notice addresses this reader. Deliberately explainable —
    the brief rules out AI matching, and a reader should be able to see why a
    notice reached them."""
    author = company(item["author_id"])
    points = 0

    # Addressed to my kind of company, or addressed to everyone.
    if not item["addressed_to"] or me["type"] in item["addressed_to"]:
        points += 3

    # Sector dominates: a Swiss textile brand has no use for glulam beams. Cross-
    # sector notices are pushed down rather than hidden — Arena is deliberately
    # cross-sector, and the occasional crossover is worth seeing.
    notice_sector = item.get("sector")
    if notice_sector is None or notice_sector == me["sector"]:
        points += 4
    else:
        points -= 3

    if author is not None:
        # Someone upstream of you is someone you might buy from.
        distance = CHAIN_POSITION_ORDER.index(me["chain_position"]) - CHAIN_POSITION_ORDER.index(
            author["chain_position"]
        )
        if distance > 0:
            points += 2
        shared = set(author["capabilities"]["materials"]) & set(me["capabilities"]["materials"])
        points += min(len(shared), 2)

    # Recency breaks ties.
    return (-points, item["posted_at"])


def feed_for(company_id: str) -> dict[str, Any]:
    me = company(company_id)
    if me is None:
        return {"from_connections": [], "for_you": []}

    connected = _connected_ids(company_id)
    mine_and_connections = connected | {company_id}

    from_connections = sorted(
        [n for n in notices if n["author_id"] in mine_and_connections],
        key=lambda n: n["posted_at"],
        reverse=True,
    )
    for_you = sorted(
        [n for n in notices if n["author_id"] not in mine_and_connections],
        key=lambda n: (_notice_score(n, me)[0], _invert(n["posted_at"])),
    )

    return {"from_connections": from_connections, "for_you": for_you}


def _invert(date_string: str) -> str:
    """Sort a date descending inside an ascending tuple sort."""
    return "".join(chr(255 - ord(ch)) for ch in date_string)
