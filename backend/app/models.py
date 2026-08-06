"""Pydantic schemas for the Arena prototype.

These models are the contract between the FastAPI backend and the Next.js frontend.
`frontend/src/lib/types.ts` mirrors them — change one, change the other.

Everything here describes *fictional demo data*. No real company is represented.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

CompanyType = Literal[
    "brand",
    "supplier",
    "manufacturer",
    "processor",
    "raw_material_producer",
]

Sector = Literal["textile", "construction"]

ChainPosition = Literal[
    "raw_material",
    "processing",
    "manufacturing",
    "distribution",
    "brand",
]

ConnectionStatus = Literal["pending", "accepted", "declined"]

TraceabilityStatus = Literal["declared", "confirmed", "verified"]

RelationshipStatus = Literal[
    "to_discover",
    "contacted",
    "connected",
    "in_discussion",
    "evaluation",
    "active_partner",
]

ContextType = Literal["company", "product", "opportunity"]


class Visual(BaseModel):
    """Instructions for a locally generated SVG. No remote images — the prototype
    must render with no internet access."""

    pattern: str
    tone: int = Field(ge=0, le=5)


class Logo(BaseModel):
    monogram: str
    tone: int = Field(ge=0, le=5)


class Capabilities(BaseModel):
    product_types: list[str]
    materials: list[str]
    machines: list[str]
    processes: list[str]
    production_capacity: str
    customization: list[str]
    moq: str
    certifications: list[str]


class Company(BaseModel):
    id: str
    name: str
    type: CompanyType
    sector: Sector
    subsector: str
    chain_position: ChainPosition
    country: str
    country_name: str
    city: str
    region: str
    founded: int
    employees: str
    revenue_range: str
    website: str
    logo: Logo
    tagline: str
    description: str
    mission: str
    vision: str
    goals: list[str]
    seeking: list[str]
    regions_served: list[str]
    capabilities: Capabilities
    connections: list[str]


class Spec(BaseModel):
    label: str
    value: str


class Product(BaseModel):
    id: str
    name: str
    category: str
    sector: Sector
    supplier_id: str
    material: str
    materials: list[str]
    country: str
    country_name: str
    visual: Visual
    description: str
    certifications: list[str]
    specs: list[Spec]
    processes: list[str]
    applications: list[str]
    moq: str
    lead_time: str
    customization: list[str]
    traceability_chain: str | None = None


class CompanyDetail(BaseModel):
    """Everything the profile page needs, in one round trip."""

    company: Company
    products: list[Product]
    network: list[Company]


class ProductDetail(BaseModel):
    product: Product
    supplier: Company
    has_traceability: bool


class TraceabilityStep(BaseModel):
    order: int
    company_id: str
    role: str
    country: str
    country_name: str
    material: str
    process: str
    status: TraceabilityStatus
    note: str


class TraceabilityChain(BaseModel):
    id: str
    product_id: str
    sector: Sector
    summary: str
    steps: list[TraceabilityStep]


class Connection(BaseModel):
    id: str
    from_id: str
    to_id: str
    status: ConnectionStatus
    created_at: str
    responded_at: str | None = None
    message: str


class ConnectionsView(BaseModel):
    """Connections grouped from the point of view of the simulated company."""

    accepted: list[Connection]
    incoming: list[Connection]
    outgoing: list[Connection]
    suggestions: list[str]


class ConnectionCreate(BaseModel):
    from_id: str
    to_id: str
    message: str = ""


class ConnectionUpdate(BaseModel):
    status: Literal["accepted", "declined"]


class Message(BaseModel):
    id: str
    from_id: str
    body: str
    sent_at: str


class ConversationContext(BaseModel):
    type: ContextType
    id: str
    label: str


class Conversation(BaseModel):
    id: str
    participants: list[str]
    context: ConversationContext
    messages: list[Message]


class MessageCreate(BaseModel):
    conversation_id: str
    from_id: str
    body: str


class Opportunity(BaseModel):
    id: str
    title: str
    company_id: str
    sector: Sector
    region: str
    description: str
    skills: list[str]
    posted_at: str
    deadline: str
    interested: bool = False


class Relationship(BaseModel):
    id: str
    owner_id: str
    company_id: str
    status: RelationshipStatus
    status_since: str
    first_seen: str
    note: str


class RelationshipUpdate(BaseModel):
    status: RelationshipStatus


class RelationshipCreate(BaseModel):
    owner_id: str
    company_id: str
    status: RelationshipStatus = "to_discover"
    note: str = ""


class FacetValue(BaseModel):
    value: str
    label: str
    count: int


class Facets(BaseModel):
    """Live counts so filter controls can show what a choice would yield."""

    company_types: list[FacetValue]
    sectors: list[FacetValue]
    countries: list[FacetValue]
    chain_positions: list[FacetValue]
    product_types: list[FacetValue]
    materials: list[FacetValue]
    certifications: list[FacetValue]
    product_categories: list[FacetValue]
    product_materials: list[FacetValue]
    product_countries: list[FacetValue]
    product_certifications: list[FacetValue]
    suppliers: list[FacetValue]
