import type {
  ImportProcessDashboardSummary,
  ImportProcessListParams,
  ImportProcessListResponse,
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
