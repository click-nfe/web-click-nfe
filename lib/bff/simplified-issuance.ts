import { bffClient } from "@/lib/bff/client";
import { routes } from "@/lib/api/routes";
import type { ImportProcessRecord } from "@/lib/api/import-process";
import type { Reconciliation, SimplifiedConfig, SimplifiedSaved, SimplifiedPreparation, SimplifiedTemplate } from "@/lib/api/simplified-issuance";

export async function saveSimplifiedConfig(clientId: string, config: SimplifiedConfig) {
  return (await bffClient.put<SimplifiedSaved>(routes.bff.client.simplifiedIssuance(clientId), config)).data;
}
export async function startSimplifiedProcess(clientId: string, options: { duimp_number?: string; template_id?: string; config?: SimplifiedConfig } = {}) {
  return (await bffClient.post<ImportProcessRecord>(routes.bff.client.simplifiedIssuanceStart(clientId), options)).data;
}
export async function createSimplifiedTemplate(clientId: string, payload: { name: string; description: string; config: SimplifiedConfig }) {
  return (await bffClient.post<SimplifiedTemplate>(routes.bff.client.simplifiedTemplates(clientId), payload)).data;
}
export async function updateSimplifiedTemplate(clientId: string, templateId: string, payload: { name: string; description: string; config: SimplifiedConfig }) {
  return (await bffClient.put<SimplifiedTemplate>(routes.bff.client.simplifiedTemplate(clientId, templateId), payload)).data;
}
export async function archiveSimplifiedTemplate(clientId: string, templateId: string) {
  await bffClient.delete(routes.bff.client.simplifiedTemplate(clientId, templateId));
}
export async function prepareSimplifiedProcess(processId: string, options: { number?: number; sign: boolean; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string>; manual_payload?: Record<string, unknown> }) {
  return (await bffClient.post<SimplifiedPreparation>(routes.bff.importProcess.simplifiedPrepare(processId), options)).data;
}
export async function saveSimplifiedLinks(processId: string, links: Record<string, number>) {
  return (await bffClient.put<Reconciliation>(routes.bff.importProcess.simplifiedReconciliation(processId), { links })).data;
}
