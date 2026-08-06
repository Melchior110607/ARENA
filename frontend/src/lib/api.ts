/**
 * Typed client for the Arena API.
 *
 * Two base URLs, on purpose:
 *  - server components run inside the compose network and reach the container
 *    directly (`INTERNAL_API_URL`, e.g. http://backend:8000);
 *  - the browser reaches the published port (`NEXT_PUBLIC_API_URL`,
 *    e.g. http://localhost:8100) with CORS allowed on the FastAPI side.
 *
 * Both paths are real HTTP calls — open the network tab during a demo and you
 * will see them.
 */

import type {
  Company,
  CompanyDetail,
  Connection,
  ConnectionsView,
  Conversation,
  Facets,
  Message,
  Opportunity,
  Product,
  ProductDetail,
  Relationship,
  RelationshipStatus,
  TraceabilityChain,
} from "./types";

const FALLBACK = "http://localhost:8100";

export function apiBase(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? FALLBACK;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}${path}`;
  const response = await fetch(url, {
    // Data is mutable in memory; a cached read would show a stale network.
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // Non-JSON error body — keep the status text.
    }
    throw new ApiError(response.status, path, detail);
  }

  return (await response.json()) as T;
}

/* ------------------------------- reads -------------------------------- */

export const getCompanies = (query?: {
  type?: string;
  sector?: string;
  country?: string;
  chain_position?: string;
  product_type?: string;
  material?: string;
  certification?: string;
  q?: string;
}) => request<Company[]>(withQuery("/companies", query));

export const getCompany = (id: string) => request<CompanyDetail>(`/companies/${id}`);

export const getProducts = (query?: {
  category?: string;
  material?: string;
  country?: string;
  supplier?: string;
  certification?: string;
  sector?: string;
  q?: string;
}) => request<Product[]>(withQuery("/products", query));

export const getProduct = (id: string) => request<ProductDetail>(`/products/${id}`);

export const getTraceability = (productId: string) =>
  request<TraceabilityChain>(`/products/${productId}/traceability`);

export const getOpportunities = (query?: { sector?: string; region?: string }) =>
  request<Opportunity[]>(withQuery("/opportunities", query));

export const getConnections = (as: string) =>
  request<ConnectionsView>(withQuery("/connections", { as }));

export const getConversations = (as: string) =>
  request<Conversation[]>(withQuery("/messages", { as }));

export const getConversation = (id: string) => request<Conversation>(`/messages/${id}`);

export const getRelationships = (as: string) =>
  request<Relationship[]>(withQuery("/relationships", { as }));

export const getFacets = () => request<Facets>("/filters");

export const getPersonas = () => request<Company[]>("/personas");

/* ------------------------------ mutations ------------------------------ */
/* These change in-memory state on the backend. Nothing persists a restart,
   and nothing reaches a real company. */

export const createConnection = (body: { from_id: string; to_id: string; message?: string }) =>
  request<Connection>("/connections", { method: "POST", body: JSON.stringify(body) });

export const respondToConnection = (id: string, status: "accepted" | "declined") =>
  request<Connection>(`/connections/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const sendMessage = (body: { conversation_id: string; from_id: string; body: string }) =>
  request<Message>("/messages", { method: "POST", body: JSON.stringify(body) });

export const expressInterest = (opportunityId: string) =>
  request<Opportunity>(`/opportunities/${opportunityId}/interest`, { method: "POST" });

export const trackRelationship = (body: {
  owner_id: string;
  company_id: string;
  status?: RelationshipStatus;
  note?: string;
}) => request<Relationship>("/relationships", { method: "POST", body: JSON.stringify(body) });

export const moveRelationship = (id: string, status: RelationshipStatus) =>
  request<Relationship>(`/relationships/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
