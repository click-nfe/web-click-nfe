import type { AxiosRequestConfig } from "axios";

import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export const importProcessStatuses = [
  "created",
  "duimp_fetching",
  "duimp_fetched",
  "duimp_fetch_failed",
  "duimp_normalized",
  "fiscal_draft_created",
  "draft_validation_failed",
  "draft_ready",
  "xml_generated",
  "xml_validation_failed",
  "xml_validated",
  "xml_signed",
  "transmission_pending",
  "transmitted",
  "authorized",
  "rejected",
  "cancelled",
  "failed",
] as const;

export type ImportProcessStatus = (typeof importProcessStatuses)[number];

export type ImportProcessListParams = {
  status?: ImportProcessStatus;
  source?: string;
  importerId?: string;
  duimpNumber?: string;
  query?: string;
  createdByMe?: boolean;
  limit?: number;
  offset?: number;
};

export type ImportProcessSummary = {
  id: string;
  organization_id: string;
  importer_id: string;
  reference_code: string;
  duimp_number: string | null;
  duimp_version: string | null;
  status: ImportProcessStatus;
  source: string;
  created_by_user_id: string | null;
  created_by_me: boolean;
  has_fiscal_profile: boolean;
  snapshots_count: number;
  latest_draft_id: string | null;
  latest_draft_status: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
  importer: {
    id: string;
    name: string;
    legal_name: string;
    cnpj: string;
  };
  next_action: string;
  pending: boolean;
  planned_documents_count: number;
  last_responsible: {
    id: string;
    name: string;
    is_current_user: boolean;
  } | null;
};

export type ImportProcessListResponse = {
  items: ImportProcessSummary[];
  total: number;
  status: ImportProcessStatus | null;
  source: string | null;
  importer_id: string | null;
  duimp_number: string | null;
  q: string | null;
  created_by_me: boolean;
  limit: number;
  offset: number;
};

export type ImportProcessDashboardSummary = {
  total: number;
  in_progress: number;
  ready_for_emission: number;
  attention_required: number;
  completed: number;
  by_status: Record<ImportProcessStatus, number>;
};

export type ImportProcessRecord = {
  id: string;
  organization_id: string;
  importer_id: string;
  reference_code: string;
  duimp_number: string | null;
  duimp_version: string | null;
  status: ImportProcessStatus;
  source: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateImportProcessPayload = {
  importer_id: string;
  source: "portal_unico";
};

export type UpdateImportProcessPayload = {
  duimp_number: string;
  source: "portal_unico";
};

export type NfeWorkflowStep = {
  key: string;
  label: string;
  status: "completed" | "current" | "blocked";
  can_view: boolean;
};

export type NfeWorkflowState = {
  process: {
    id: string;
    importer_id: string;
    reference_code: string;
    duimp_number: string | null;
    status: ImportProcessStatus;
    [key: string]: unknown;
  };
  latest_snapshot: {
    id: string;
    duimp_number: string;
    duimp_version: string | null;
    source_provider: string;
    fetched_at: string | null;
    created_at: string;
  } | null;
  prerequisites: {
    has_fiscal_profile: boolean;
    has_active_tax_rule: boolean;
    active_tax_rule_count: number;
    tax_rule_conflict_count: number;
    has_number_sequence: boolean;
    has_provider_connection: boolean;
    has_item_classification: boolean;
    item_classification_ready: boolean;
    has_document_plan: boolean;
    planned_documents_count: number;
    import_purpose: string | null;
    environment: string;
    series: string;
  };
  next_action: string;
  current_step: string;
  furthest_available_step: string;
  steps: NfeWorkflowStep[];
  context: unknown;
  item_classification: unknown;
  document_plan: unknown;
  latest_draft: unknown;
};

export type DuimpFetchResult = {
  snapshot: {
    id: string;
    import_process_id: string;
    duimp_number: string;
    duimp_version: string | null;
    source_provider: string;
    fetched_at: string | null;
    created_at: string;
  };
  normalized: Record<string, unknown>;
};

function toBackendParams(params: ImportProcessListParams = {}) {
  return {
    status: params.status,
    source: params.source,
    importer_id: params.importerId,
    duimp_number: params.duimpNumber,
    q: params.query,
    created_by_me: params.createdByMe,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function listImportProcesses(
  accessToken: string,
  params?: ImportProcessListParams,
) {
  const config: AxiosRequestConfig = {
    ...bearerConfig(accessToken),
    params: toBackendParams(params),
  };
  const response = await apiClient.get<ImportProcessListResponse>(
    routes.backend.importProcess.list,
    config,
  );
  return response.data;
}

export async function getImportProcessDashboardSummary(accessToken: string) {
  const response = await apiClient.get<ImportProcessDashboardSummary>(
    routes.backend.importProcess.dashboardSummary,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getImportProcess(accessToken: string, id: string) {
  const response = await apiClient.get<ImportProcessRecord>(
    routes.backend.importProcess.detail(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function createImportProcess(
  accessToken: string,
  payload: CreateImportProcessPayload,
) {
  const response = await apiClient.post<ImportProcessRecord>(
    routes.backend.importProcess.list,
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateImportProcess(
  accessToken: string,
  id: string,
  payload: UpdateImportProcessPayload,
) {
  const response = await apiClient.put<ImportProcessRecord>(
    routes.backend.importProcess.detail(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeWorkflowState(accessToken: string, id: string) {
  const response = await apiClient.get<NfeWorkflowState>(
    routes.backend.importProcess.workflowState(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function fetchProcessDuimp(accessToken: string, id: string) {
  const response = await apiClient.post<DuimpFetchResult>(
    routes.backend.importProcess.duimpFetch(id),
    {
      provider_environment: "production",
      source_provider: "portal_unico",
      enrich_catalog: true,
    },
    bearerConfig(accessToken),
  );
  return response.data;
}
