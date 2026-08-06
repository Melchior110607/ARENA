/**
 * Mirrors `backend/app/models.py`. Change one, change the other.
 *
 * Everything described here is fictional demo data.
 */

export type CompanyType =
  | "brand"
  | "supplier"
  | "manufacturer"
  | "processor"
  | "raw_material_producer";

export type Sector = "textile" | "construction";

export type ChainPosition =
  | "raw_material"
  | "processing"
  | "manufacturing"
  | "distribution"
  | "brand";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type TraceabilityStatus = "declared" | "confirmed" | "verified";

export type RelationshipStatus =
  | "to_discover"
  | "contacted"
  | "connected"
  | "in_discussion"
  | "evaluation"
  | "active_partner";

export type ContextType = "company" | "product" | "opportunity";

/** Instructions for a locally generated SVG. No remote images anywhere. */
export interface Visual {
  pattern: string;
  /** 0-5, maps onto the design system's accent scale. */
  tone: number;
}

export interface Logo {
  monogram: string;
  tone: number;
}

export interface Capabilities {
  product_types: string[];
  materials: string[];
  machines: string[];
  processes: string[];
  production_capacity: string;
  customization: string[];
  moq: string;
  certifications: string[];
}

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  sector: Sector;
  subsector: string;
  chain_position: ChainPosition;
  country: string;
  country_name: string;
  city: string;
  region: string;
  founded: number;
  employees: string;
  revenue_range: string;
  website: string;
  logo: Logo;
  tagline: string;
  description: string;
  mission: string;
  vision: string;
  goals: string[];
  seeking: string[];
  regions_served: string[];
  capabilities: Capabilities;
  connections: string[];
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sector: Sector;
  supplier_id: string;
  material: string;
  materials: string[];
  country: string;
  country_name: string;
  visual: Visual;
  description: string;
  certifications: string[];
  specs: Spec[];
  processes: string[];
  applications: string[];
  moq: string;
  lead_time: string;
  customization: string[];
  traceability_chain: string | null;
}

export interface CompanyDetail {
  company: Company;
  products: Product[];
  network: Company[];
}

export interface ProductDetail {
  product: Product;
  supplier: Company;
  has_traceability: boolean;
}

export interface TraceabilityStep {
  order: number;
  company_id: string;
  role: string;
  country: string;
  country_name: string;
  material: string;
  process: string;
  status: TraceabilityStatus;
  note: string;
}

export interface TraceabilityChain {
  id: string;
  product_id: string;
  sector: Sector;
  summary: string;
  steps: TraceabilityStep[];
}

export interface Connection {
  id: string;
  from_id: string;
  to_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
  message: string;
}

export interface ConnectionsView {
  accepted: Connection[];
  incoming: Connection[];
  outgoing: Connection[];
  /** Company ids, ranked by how well they complete the persona's chain. */
  suggestions: string[];
}

export interface Message {
  id: string;
  from_id: string;
  body: string;
  sent_at: string;
}

export interface ConversationContext {
  type: ContextType;
  id: string;
  label: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  context: ConversationContext;
  messages: Message[];
}

export interface Opportunity {
  id: string;
  title: string;
  company_id: string;
  sector: Sector;
  region: string;
  description: string;
  skills: string[];
  posted_at: string;
  deadline: string;
  interested: boolean;
}

export interface Relationship {
  id: string;
  owner_id: string;
  company_id: string;
  status: RelationshipStatus;
  status_since: string;
  first_seen: string;
  note: string;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  company_types: FacetValue[];
  sectors: FacetValue[];
  countries: FacetValue[];
  chain_positions: FacetValue[];
  product_types: FacetValue[];
  materials: FacetValue[];
  certifications: FacetValue[];
  product_categories: FacetValue[];
  product_materials: FacetValue[];
  product_countries: FacetValue[];
  product_certifications: FacetValue[];
  suppliers: FacetValue[];
}

/* ------------------------------------------------------------------ */
/* Display labels — the API returns machine values, the UI shows these */
/* ------------------------------------------------------------------ */

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  brand: "Brand",
  supplier: "Supplier",
  manufacturer: "Manufacturer",
  processor: "Processor",
  raw_material_producer: "Raw material producer",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  textile: "Textile",
  construction: "Construction",
};

/** Ordered upstream to downstream — the value chain reads left to right. */
export const CHAIN_POSITION_ORDER: ChainPosition[] = [
  "raw_material",
  "processing",
  "manufacturing",
  "distribution",
  "brand",
];

export const CHAIN_POSITION_LABELS: Record<ChainPosition, string> = {
  raw_material: "Raw material",
  processing: "Processing",
  manufacturing: "Manufacturing",
  distribution: "Distribution",
  brand: "Brand",
};

/** Ordered as the pipeline progresses. */
export const RELATIONSHIP_STATUS_ORDER: RelationshipStatus[] = [
  "to_discover",
  "contacted",
  "connected",
  "in_discussion",
  "evaluation",
  "active_partner",
];

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  to_discover: "To discover",
  contacted: "Contacted",
  connected: "Connected",
  in_discussion: "In discussion",
  evaluation: "Evaluation",
  active_partner: "Active partner",
};

export const TRACEABILITY_STATUS_LABELS: Record<TraceabilityStatus, string> = {
  declared: "Declared",
  confirmed: "Confirmed",
  verified: "Verified",
};

/** Ordered weakest to strongest claim. */
export const TRACEABILITY_STATUS_ORDER: TraceabilityStatus[] = [
  "declared",
  "confirmed",
  "verified",
];
