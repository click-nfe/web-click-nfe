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
  const response = await apiClient.get<ImportProcessSummary>(
    routes.backend.importProcess.detail(id),
    bearerConfig(accessToken),
  );
  return response.data;
}
