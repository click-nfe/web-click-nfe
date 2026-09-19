import type {
  ClientImportTaxRule,
  ClientImportTaxRulePayload,
  ImportTaxRuleSimulation,
  ImportTaxRuleSimulationPayload,
} from "@/lib/api/client-import-tax-rule";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function createClientImportTaxRule(
  clientId: string,
  payload: ClientImportTaxRulePayload,
) {
  const response = await bffClient.post<ClientImportTaxRule>(
    routes.bff.client.importTaxRules(clientId),
    payload,
  );
  return response.data;
}

export async function updateClientImportTaxRule(
  clientId: string,
  ruleId: string,
  payload: ClientImportTaxRulePayload | Partial<ClientImportTaxRulePayload>,
) {
  const response = await bffClient.put<ClientImportTaxRule>(
    routes.bff.client.importTaxRule(clientId, ruleId),
    payload,
  );
  return response.data;
}

export async function deactivateClientImportTaxRule(
  clientId: string,
  ruleId: string,
) {
  await bffClient.delete(routes.bff.client.importTaxRule(clientId, ruleId));
}

export async function simulateClientImportTaxRule(
  clientId: string,
  payload: ImportTaxRuleSimulationPayload,
) {
  const response = await bffClient.post<ImportTaxRuleSimulation>(
    routes.bff.client.importTaxRuleSimulation(clientId),
    payload,
  );
  return response.data;
}
