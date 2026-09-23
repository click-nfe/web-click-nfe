import type {
  CreateImportProcessPayload,
  DuimpFetchResult,
  ImportProcessDashboardSummary,
  ImportProcessListParams,
  ImportProcessListResponse,
  ImportProcessRecord,
  NfeContextState,
  NfeItemClassificationState,
  NfeWorkflowState,
  ResolveNfeContextPayload,
  SaveNfeItemClassificationsPayload,
  UpdateImportProcessPayload,
} from "@/lib/api/import-process";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export function importProcessListUrl(params: ImportProcessListParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.source) search.set("source", params.source);
  if (params.importerId) search.set("importer_id", params.importerId);
  if (params.duimpNumber) search.set("duimp_number", params.duimpNumber);
  if (params.query) search.set("q", params.query);
  if (params.createdByMe) search.set("created_by_me", "true");
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  return `${routes.bff.importProcess.list}${query ? `?${query}` : ""}`;
}

export async function listImportProcesses(params?: ImportProcessListParams) {
  const response = await bffClient.get<ImportProcessListResponse>(
    importProcessListUrl(params),
  );
  return response.data;
}

export async function getImportProcessDashboardSummary() {
  const response = await bffClient.get<ImportProcessDashboardSummary>(
    routes.bff.importProcess.dashboardSummary,
  );
  return response.data;
}

export async function createImportProcess(payload: CreateImportProcessPayload) {
  const response = await bffClient.post<ImportProcessRecord>(
    routes.bff.importProcess.list,
    payload,
  );
  return response.data;
}

export async function updateImportProcess(
  id: string,
  payload: UpdateImportProcessPayload,
) {
  const response = await bffClient.put<ImportProcessRecord>(
    routes.bff.importProcess.detail(id),
    payload,
  );
  return response.data;
}

export async function fetchProcessDuimp(id: string) {
  const response = await bffClient.post<DuimpFetchResult>(
    routes.bff.importProcess.duimpFetch(id),
  );
  return response.data;
}

export async function getNfeWorkflowState(id: string) {
  const response = await bffClient.get<NfeWorkflowState>(
    routes.bff.importProcess.workflowState(id),
  );
  return response.data;
}

export function nfeContextUrl(id: string, snapshotId?: string) {
  const search = new URLSearchParams();
  if (snapshotId) search.set("duimp_snapshot_id", snapshotId);
  const query = search.toString();
  return `${routes.bff.importProcess.nfeContext(id)}${query ? `?${query}` : ""}`;
}

export async function resolveNfeContext(
  id: string,
  payload: ResolveNfeContextPayload,
) {
  const response = await bffClient.post<NfeContextState>(
    routes.bff.importProcess.nfeContext(id),
    payload,
  );
  return response.data;
}

export function itemClassificationsUrl(id: string, snapshotId?: string) {
  const search = new URLSearchParams();
  if (snapshotId) search.set("duimp_snapshot_id", snapshotId);
  const query = search.toString();
  return `${routes.bff.importProcess.itemClassifications(id)}${query ? `?${query}` : ""}`;
}

export async function saveNfeItemClassifications(
  id: string,
  payload: SaveNfeItemClassificationsPayload,
) {
  const response = await bffClient.put<NfeItemClassificationState>(
    routes.bff.importProcess.itemClassifications(id),
    payload,
  );
  return response.data;
}
