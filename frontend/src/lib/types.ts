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

export type NoticeKind = "need" | "offer";

/** What a conversation or a connection request refers to. */
export type ContextType = "company" | "product" | "notice";

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

/**
 * What a connection request is about. A request always starts from something —
 * a company found in the directory, a product in the catalogue, or a notice on
 * the floor. The context travels into the conversation the request opens.
 */
export interface ConnectionContext {
  type: ContextType;
  id: string;
  label: string;
}

export interface Connection {
  id: string;
  from_id: string;
  to_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
  message: string;
  context: ConnectionContext | null;
  /** Set when the request is accepted — the conversation it opened. */
  conversation_id: string | null;
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

/**
 * A post on the floor. Either a `need` (a brief — what a company is looking for)
 * or an `offer` (a product a company puts forward). Both declare `addressed_to`:
 * which of the five company types the notice speaks to. An empty list means the
 * notice is open to everyone.
 */
export interface Notice {
  id: string;
  author_id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  addressed_to: CompanyType[];
  sector: Sector | null;
  /** Needs only. */
  region: string | null;
  skills: string[];
  deadline: string | null;
  /** Offers only — a product belonging to the author. */
  product_id: string | null;
  posted_at: string;
  interested_by: string[];
}

/** The floor, seen from one company: connections first, then what addresses them. */
export interface Feed {
  from_connections: Notice[];
  for_you: Notice[];
}

export interface NoticeDraft {
  author_id: string;
  kind: NoticeKind;
  title: string;
  body?: string;
  addressed_to?: CompanyType[];
  sector?: Sector | null;
  region?: string | null;
  skills?: string[];
  deadline?: string | null;
  product_id?: string | null;
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

/** The five company types, in chain order — the audience a notice can address. */
export const COMPANY_TYPE_ORDER: CompanyType[] = [
  "raw_material_producer",
  "processor",
  "manufacturer",
  "supplier",
  "brand",
];

export const NOTICE_KIND_LABELS: Record<NoticeKind, string> = {
  need: "Need",
  offer: "Offer",
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
