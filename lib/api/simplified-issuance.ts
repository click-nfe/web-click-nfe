import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";
import type { ImportProcessRecord } from "@/lib/api/import-process";

export type SimplifiedItem = {
  reference: string; product_code: string; description: string; ncm: string;
  cfop: string; unit: string; import_purpose: string;
  tax_configuration: Record<string, string | boolean>;
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
export type SimplifiedOperation = { duimp_number: string; number: string; sign: boolean; consult_portal: boolean; registration_date?: string; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string> };
export type SimplifiedPreparation = { status: "needs_review" | "validated" | "signed"; process_id: string; message?: string; unmatched_items?: string[]; unclassified_items?: string[]; results?: Array<{ draft_id: string; success: boolean; message?: string; xsd_errors?: unknown[] }> };
export type SimplifiedSaved = { config: SimplifiedConfig | null; updated_at: string | null };
export type SimplifiedTemplate = { id: string; name: string; description: string; config: SimplifiedConfig; created_at: string | null; updated_at: string | null };
export type SimplifiedTemplateList = { items: Array<Pick<SimplifiedTemplate, "id" | "name" | "description" | "updated_at"> & { item_count: number }> };
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
export async function startSimplifiedProcess(token: string, clientId: string, options: { duimp_number?: string; template_id?: string; config?: SimplifiedConfig } = {}) {
  return (await apiClient.post<ImportProcessRecord>(routes.backend.client.simplifiedIssuanceStart(clientId), options, bearerConfig(token))).data;
}
export async function listSimplifiedTemplates(token: string, clientId: string) {
  return (await apiClient.get<SimplifiedTemplateList>(routes.backend.client.simplifiedTemplates(clientId), bearerConfig(token))).data;
}
export async function getSimplifiedTemplate(token: string, clientId: string, templateId: string) {
  return (await apiClient.get<SimplifiedTemplate>(routes.backend.client.simplifiedTemplate(clientId, templateId), bearerConfig(token))).data;
}
export async function createSimplifiedTemplate(token: string, clientId: string, payload: { name: string; description: string; config: SimplifiedConfig }) {
  return (await apiClient.post<SimplifiedTemplate>(routes.backend.client.simplifiedTemplates(clientId), payload, bearerConfig(token))).data;
}
export async function updateSimplifiedTemplate(token: string, clientId: string, templateId: string, payload: { name: string; description: string; config: SimplifiedConfig }) {
  return (await apiClient.put<SimplifiedTemplate>(routes.backend.client.simplifiedTemplate(clientId, templateId), payload, bearerConfig(token))).data;
}
export async function archiveSimplifiedTemplate(token: string, clientId: string, templateId: string) {
  await apiClient.delete(routes.backend.client.simplifiedTemplate(clientId, templateId), bearerConfig(token));
}
export async function prepareSimplifiedProcess(token: string, processId: string, options: { number?: number; sign: boolean; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string>; manual_payload?: Record<string, unknown> }) {
  return (await apiClient.post<SimplifiedPreparation>(routes.backend.importProcess.simplifiedPrepare(processId), options, bearerConfig(token))).data;
}
export async function getSimplifiedReconciliation(token: string, processId: string) {
  return (await apiClient.get<Reconciliation>(routes.backend.importProcess.simplifiedReconciliation(processId), bearerConfig(token))).data;
}
export async function saveSimplifiedLinks(token: string, processId: string, links: Record<string, number>) {
  return (await apiClient.put<Reconciliation>(routes.backend.importProcess.simplifiedReconciliation(processId), { links }, bearerConfig(token))).data;
}
