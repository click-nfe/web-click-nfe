import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type ImportPurpose =
  | "resale"
  | "industrialization"
  | "fixed_asset"
  | "use_consumption";
export type ImportModality = "direct" | "on_behalf" | "by_order";
export type TaxRegime = "1" | "2" | "3";
export type NcmScopeType = "all" | "prefix" | "exact";

export type ImportTaxConfiguration = {
  cfop: string;
  icms_origin: string;
  icms_cst: string;
  icms_rate?: string;
  icms_base_reduction_rate?: string;
  icms_deferment_rate?: string;
  icms_st_base_method?: "4" | "6";
  icms_st_mva_rate?: string;
  icms_st_base_reduction_rate?: string;
  icms_st_rate?: string;
  icms_st_retained_base?: string;
  icms_st_retained_rate?: string;
  icms_st_retained_value?: string;
  icms_tax_treatment_confirmed?: boolean;
  [key: string]: unknown;
};

export type ClientImportTaxRule = {
  id: string;
  organization_id?: string;
  client_id: string;
  name: string;
  issuer_state: string;
  import_purpose: ImportPurpose;
  import_modality: ImportModality | null;
  tax_regime: TaxRegime | null;
  ncm_pattern: string | null;
  ncm_scope_type: NcmScopeType;
  ncm_patterns: string[];
  priority: number;
  revision: number;
  configuration_json: ImportTaxConfiguration;
  additional_cost_defaults: Record<string, unknown> | null;
  transport_defaults: Record<string, unknown> | null;
  payment_defaults: Record<string, unknown> | null;
  active: boolean;
  effective_from: string | null;
  effective_until: string | null;
  created_by_user_id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientImportTaxRulePayload = {
  name: string;
  issuer_state: string;
  import_purpose: ImportPurpose;
  import_modality: ImportModality | null;
  tax_regime: TaxRegime | null;
  ncm_scope_type: NcmScopeType;
  ncm_patterns: string[];
  priority: number;
  configuration_json: ImportTaxConfiguration;
  active: boolean;
  effective_from: string | null;
  effective_until: string | null;
};

export type TaxRuleConflict = Pick<
  ClientImportTaxRule,
  | "id"
  | "name"
  | "issuer_state"
  | "import_purpose"
  | "import_modality"
  | "tax_regime"
  | "ncm_pattern"
  | "priority"
  | "effective_from"
  | "effective_until"
>;

export type ClientImportTaxRuleDiagnostic = ClientImportTaxRule & {
  conflicts: TaxRuleConflict[];
  has_conflicts: boolean;
};

export type ClientImportTaxRuleDiagnostics = {
  items: ClientImportTaxRuleDiagnostic[];
  conflicts: Array<{ rules: TaxRuleConflict[] }>;
  summary: {
    total: number;
    active: number;
    inactive: number;
    conflict_count: number;
  };
};

export type ImportTaxRuleSimulationPayload = {
  issuer_state: string;
  tax_regime: TaxRegime;
  import_purpose: ImportPurpose;
  import_modality: ImportModality | null;
  ncm: string;
  reference_date: string | null;
};

export type ImportTaxRuleSimulationCandidate = {
  rule: ClientImportTaxRule;
  mismatch_reasons: string[];
  score: [number, number, boolean, boolean] | null;
  matched_ncm_pattern: string | null;
  selected: boolean;
};

export type ImportTaxRuleSimulation = {
  status: "matched" | "no_match";
  selected_rule: ClientImportTaxRule | null;
  selection: {
    ncm: string;
    matched_ncm_pattern: string | null;
    score: [number, number, boolean, boolean] | null;
    explicit_rule: boolean;
  };
  candidates: ImportTaxRuleSimulationCandidate[];
};

export async function listClientImportTaxRules(
  accessToken: string,
  clientId: string,
) {
  const response = await apiClient.get<ClientImportTaxRule[]>(
    routes.backend.client.importTaxRules(clientId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getClientImportTaxRuleDiagnostics(
  accessToken: string,
  clientId: string,
) {
  const response = await apiClient.get<ClientImportTaxRuleDiagnostics>(
    routes.backend.client.importTaxRuleDiagnostics(clientId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function createClientImportTaxRule(
  accessToken: string,
  clientId: string,
  payload: unknown,
) {
  const response = await apiClient.post<ClientImportTaxRule>(
    routes.backend.client.importTaxRules(clientId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateClientImportTaxRule(
  accessToken: string,
  clientId: string,
  ruleId: string,
  payload: unknown,
) {
  const response = await apiClient.put<ClientImportTaxRule>(
    routes.backend.client.importTaxRule(clientId, ruleId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function deactivateClientImportTaxRule(
  accessToken: string,
  clientId: string,
  ruleId: string,
) {
  await apiClient.delete(
    routes.backend.client.importTaxRule(clientId, ruleId),
    bearerConfig(accessToken),
  );
}

export async function simulateClientImportTaxRule(
  accessToken: string,
  clientId: string,
  payload: unknown,
) {
  const response = await apiClient.post<ImportTaxRuleSimulation>(
    routes.backend.client.importTaxRuleSimulation(clientId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}
