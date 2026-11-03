import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";
import type { ImportProcessRecord } from "@/lib/api/import-process";

export type SimplifiedItem = {
  reference: string; product_code: string; description: string; ncm: string;
  cfop: string; unit: string; import_purpose: string;
  tax_configuration: Record<string, string>;
};
export type SimplifiedConfig = {
  series?: string;
  document: Record<string, string>;
  transport: Record<string, string>;
  payment?: Record<string, string>;
  volume?: Record<string, string>;
  additional_info: Record<string, string>;
  items: SimplifiedItem[];
};
export type SimplifiedOperation = { duimp_number: string; number: string; sign: boolean; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string> };
export type SimplifiedPreparation = { status: "needs_review" | "validated" | "signed"; process_id: string; message?: string; unmatched_items?: string[]; unclassified_items?: string[]; results?: Array<{ draft_id: string; success: boolean; message?: string; xsd_errors?: unknown[] }> };
export type SimplifiedSaved = { config: SimplifiedConfig | null; updated_at: string | null };
export type Reconciliation = {
  snapshot_id: string;
  templates: SimplifiedItem[];
  items: Array<{
    duimp_item_number: string; catalog_product_code: string | null;
    ncm: string; description: string; template_index: number | null;
    status: "matched" | "linked" | "ambiguous" | "unmatched";
    candidates: number[];
  }>;
};

export async function getSimplifiedConfig(token: string, clientId: string) {
  return (await apiClient.get<SimplifiedSaved>(routes.backend.client.simplifiedIssuance(clientId), bearerConfig(token))).data;
}
export async function saveSimplifiedConfig(token: string, clientId: string, config: SimplifiedConfig) {
  return (await apiClient.put<SimplifiedSaved>(routes.backend.client.simplifiedIssuance(clientId), config, bearerConfig(token))).data;
}
export async function startSimplifiedProcess(token: string, clientId: string, duimpNumber = "") {
  return (await apiClient.post<ImportProcessRecord>(routes.backend.client.simplifiedIssuanceStart(clientId), { duimp_number: duimpNumber }, bearerConfig(token))).data;
}
export async function prepareSimplifiedProcess(token: string, processId: string, options: { number?: number; sign: boolean; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string> }) {
  return (await apiClient.post<SimplifiedPreparation>(routes.backend.importProcess.simplifiedPrepare(processId), options, bearerConfig(token))).data;
}
export async function getSimplifiedReconciliation(token: string, processId: string) {
  return (await apiClient.get<Reconciliation>(routes.backend.importProcess.simplifiedReconciliation(processId), bearerConfig(token))).data;
}
export async function saveSimplifiedLinks(token: string, processId: string, links: Record<string, number>) {
  return (await apiClient.put<Reconciliation>(routes.backend.importProcess.simplifiedReconciliation(processId), { links }, bearerConfig(token))).data;
}
