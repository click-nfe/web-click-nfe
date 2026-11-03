import { bffClient } from "@/lib/bff/client";
import { routes } from "@/lib/api/routes";
import type { ImportProcessRecord } from "@/lib/api/import-process";
import type { Reconciliation, SimplifiedConfig, SimplifiedSaved, SimplifiedPreparation } from "@/lib/api/simplified-issuance";

export async function saveSimplifiedConfig(clientId: string, config: SimplifiedConfig) {
  return (await bffClient.put<SimplifiedSaved>(routes.bff.client.simplifiedIssuance(clientId), config)).data;
}
export async function startSimplifiedProcess(clientId: string, duimpNumber = "") {
  return (await bffClient.post<ImportProcessRecord>(routes.bff.client.simplifiedIssuanceStart(clientId), { duimp_number: duimpNumber })).data;
}
export async function prepareSimplifiedProcess(processId: string, options: { number?: number; sign: boolean; duimp_overrides: Record<string, string>; foreign_supplier: Record<string, string>; additional_costs: Record<string, string> }) {
  return (await bffClient.post<SimplifiedPreparation>(routes.bff.importProcess.simplifiedPrepare(processId), options)).data;
}
export async function saveSimplifiedLinks(processId: string, links: Record<string, number>) {
  return (await bffClient.put<Reconciliation>(routes.bff.importProcess.simplifiedReconciliation(processId), { links })).data;
}
