import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL as string;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json();
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type ProcessingStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";
export type WorkpackStage = "RAW" | "DEFINE" | "SHAPE" | "BOX";

export interface Workpack {
  id: string;
  title: string;
  stage: WorkpackStage;
  processingStatus: ProcessingStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string; avatarUrl?: string };
}

export interface Brief {
  id: string;
  workpackId: string;
  title: string;
  mainIdea: string;
  objective: string;
  actors: string;
  scopeIncludes: string;
  scopeExcludes: string;
  constraints: string;
  successCriteria: string;
  domainFacts: string;
  status: string;
}

export interface Box {
  id: string;
  workpackId: string;
  nodeId: string;
  title: string;
  purpose: string;
  inputContext: string;
  expectedOutput: string;
  instructions: string;
  constraints: string;
  dependencies: string;
  acceptanceCriteria: string;
  handoff: string;
  status: string;
  orderIndex: number;
}

export interface ExecutionPlan {
  id: string;
  workpackId: string;
  version: string;
  status: string;
  steps: string;
}

export interface Handoff {
  id: string;
  workpackId: string;
  handoffNotes: string;
  assumptions: string;
  approvalStatus: string;
  reviewNotes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// -----------------------------------------------------------------------
// Workpacks
// -----------------------------------------------------------------------

export const workpacksApi = {
  list: () => request<Workpack[]>("GET", "/api/workpacks"),

  get: (id: string) => request<Workpack>("GET", `/api/workpacks/${id}`),

  ingest: (title: string, content: string) =>
    request<Workpack>("POST", "/api/workpacks/ingest", { title, content }),

  shape: (id: string) =>
    request<Workpack>("POST", `/api/workpacks/${id}/shape`),

  advance: (id: string) =>
    request<Workpack>("POST", `/api/workpacks/${id}/advance`),

  updateTitle: (id: string, title: string) =>
    request<Workpack>("PATCH", `/api/workpacks/${id}/title`, { title }),

  delete: (id: string) =>
    request<void>("DELETE", `/api/workpacks/${id}`),

  downloadUrl: (id: string) => `${API_URL}/api/workpacks/${id}/download`,
};

// -----------------------------------------------------------------------
// Brief
// -----------------------------------------------------------------------

export const briefApi = {
  get: (workpackId: string) =>
    request<Brief>("GET", `/api/workpacks/${workpackId}/brief`),

  update: (workpackId: string, data: Partial<Brief>) =>
    request<Brief>("PATCH", `/api/workpacks/${workpackId}/brief`, data),
};

// -----------------------------------------------------------------------
// Boxes
// -----------------------------------------------------------------------

export const boxesApi = {
  list: (workpackId: string) =>
    request<Box[]>("GET", `/api/workpacks/${workpackId}/boxes`),

  get: (workpackId: string, boxId: string) =>
    request<Box>("GET", `/api/workpacks/${workpackId}/boxes/${boxId}`),

  update: (workpackId: string, boxId: string, data: Partial<Box>) =>
    request<Box>("PATCH", `/api/workpacks/${workpackId}/boxes/${boxId}`, data),
};

// -----------------------------------------------------------------------
// Plan
// -----------------------------------------------------------------------

export const planApi = {
  get: (workpackId: string) =>
    request<ExecutionPlan>("GET", `/api/workpacks/${workpackId}/plan`),
};

// -----------------------------------------------------------------------
// Handoff
// -----------------------------------------------------------------------

export const handoffApi = {
  get: (workpackId: string) =>
    request<Handoff>("GET", `/api/workpacks/${workpackId}/handoff`),

  update: (workpackId: string, data: Partial<Handoff>) =>
    request<Handoff>("PATCH", `/api/workpacks/${workpackId}/handoff`, data),

  approve: (workpackId: string) =>
    request<Handoff>("POST", `/api/workpacks/${workpackId}/handoff/approve`),
};

// -----------------------------------------------------------------------
// Pins
// -----------------------------------------------------------------------

export interface Pin {
  id: string;
  workpackId: string;
  content: string;
  type: string;
  createdAt: string;
  author?: { id: string; name: string };
}

export const pinsApi = {
  list: (workpackId: string) =>
    request<Pin[]>("GET", `/api/workpacks/${workpackId}/pins`),

  create: (workpackId: string, content: string, type = "TEXT") =>
    request<Pin>("POST", `/api/workpacks/${workpackId}/pins`, { content, type }),

  delete: (workpackId: string, pinId: string) =>
    request<void>("DELETE", `/api/workpacks/${workpackId}/pins/${pinId}`),
};

// -----------------------------------------------------------------------
// User
// -----------------------------------------------------------------------

export const userApi = {
  me: () => request<UserProfile>("GET", "/api/me"),

  update: (data: Partial<UserProfile>) =>
    request<UserProfile>("PATCH", "/api/me", data),
};
