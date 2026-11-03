import { bffClient } from "@/lib/bff/client";
import { routes } from "@/lib/api/routes";
import type { ImportProcessRecord } from "@/lib/api/import-process";
import type { Reconciliation, SimplifiedConfig, SimplifiedSaved } from "@/lib/api/simplified-issuance";

export async function saveSimplifiedConfig(clientId: string, config: SimplifiedConfig) {
  return (await bffClient.put<SimplifiedSaved>(routes.bff.client.simplifiedIssuance(clientId), config)).data;
}
export async function startSimplifiedProcess(clientId: string) {
  return (await bffClient.post<ImportProcessRecord>(routes.bff.client.simplifiedIssuanceStart(clientId))).data;
}
export async function saveSimplifiedLinks(processId: string, links: Record<string, number>) {
  return (await bffClient.put<Reconciliation>(routes.bff.importProcess.simplifiedReconciliation(processId), { links })).data;
}
