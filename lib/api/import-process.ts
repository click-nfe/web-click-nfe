import type { AxiosRequestConfig } from "axios";

import type { ImportPurpose } from "@/lib/api/client-import-tax-rule";
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

export type ImportProcessRecord = {
  id: string;
  organization_id: string;
  importer_id: string;
  reference_code: string;
  duimp_number: string | null;
  duimp_version: string | null;
  status: ImportProcessStatus;
  source: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateImportProcessPayload = {
  importer_id: string;
  source: "portal_unico";
};

export type UpdateImportProcessPayload = {
  duimp_number: string;
  source: "portal_unico";
};

export type NfeWorkflowStep = {
  key: string;
  label: string;
  status: "completed" | "current" | "blocked";
  can_view: boolean;
};

export type NfeWorkflowState = {
  process: {
    id: string;
    importer_id: string;
    reference_code: string;
    duimp_number: string | null;
    status: ImportProcessStatus;
    [key: string]: unknown;
  };
  latest_snapshot: {
    id: string;
    duimp_number: string;
    duimp_version: string | null;
    source_provider: string;
    fetched_at: string | null;
    created_at: string;
  } | null;
  prerequisites: {
    has_fiscal_profile: boolean;
    has_active_tax_rule: boolean;
    active_tax_rule_count: number;
    tax_rule_conflict_count: number;
    has_number_sequence: boolean;
    has_provider_connection: boolean;
    has_item_classification: boolean;
    item_classification_ready: boolean;
    has_document_plan: boolean;
    planned_documents_count: number;
    import_purpose: string | null;
    environment: string;
    series: string;
  };
  next_action: string;
  current_step: string;
  furthest_available_step: string;
  steps: NfeWorkflowStep[];
  context: unknown;
  item_classification: unknown;
  document_plan: unknown;
  latest_draft: unknown;
};

export type DuimpFetchResult = {
  snapshot: {
    id: string;
    import_process_id: string;
    duimp_number: string;
    duimp_version: string | null;
    source_provider: string;
    fetched_at: string | null;
    created_at: string;
  };
  normalized: Record<string, unknown>;
};

export type DuimpSnapshotDetails = {
  id: string;
  import_process_id: string;
  duimp_number: string;
  duimp_version: string | null;
  source_provider: string;
  fetched_at: string | null;
  created_at: string;
  normalized: Record<string, unknown>;
};

export type NfeContextField = {
  value: string | null;
  source: string | null;
  status: "resolved" | "missing";
};

export type NfeContextState = {
  process_id: string;
  snapshot_id: string;
  normalized: {
    number?: string | null;
    registration_date?: string | null;
    import_modality?: string | null;
    clearance_location?: string | null;
    clearance_state?: string | null;
    clearance_date?: string | null;
    transport_mode_code?: string | null;
    foreign_supplier?: {
      name?: string | null;
      country_code?: string | null;
      country_name?: string | null;
      country_iso_alpha_2?: string | null;
    };
    items?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  fields: Record<string, NfeContextField>;
  missing_fields: string[];
  ready_for_draft: boolean;
  external: { errors?: Array<{ source?: string; code?: string; message?: string }> };
  suggested: {
    duimp_overrides?: Record<string, unknown>;
    foreign_supplier?: Record<string, unknown> | null;
    additional_costs?: Record<string, string>;
  };
  fiscal_references?: Record<string, unknown>;
  tax_rule?: Record<string, unknown> | null;
  tax_rules?: Array<Record<string, unknown>>;
  refresh?: {
    requested: boolean;
    snapshot_changed: boolean;
    previous_snapshot_id: string;
    snapshot_id: string;
  };
};

export type ResolveNfeContextPayload = {
  duimp_snapshot_id: string;
  refresh_external: boolean;
  overrides: {
    clearance_location?: string;
    clearance_state?: string;
    clearance_date?: string;
    transport_mode_code?: string;
    foreign_supplier?: {
      name?: string;
      country_code?: string;
      country_name?: string;
      country_iso_alpha_2?: string;
    };
  };
};

export type NfeItemClassificationStatus =
  | "unclassified"
  | "missing_tax_rule"
  | "inactive_tax_rule"
  | "stale_tax_rule"
  | "missing_cfop"
  | "classified";

export type NfeItemRuleCandidate = {
  id: string;
  name: string;
  mismatch_reasons: string[];
  issuer_state: string;
  tax_regime: string | null;
  import_modality: string | null;
  ncm_pattern: string | null;
  ncm_scope_type: string;
  ncm_patterns: string[];
  effective_from: string | null;
  effective_until: string | null;
  cfop: string;
};

export type NfeItemClassification = {
  duimp_item_number: string;
  product_code: string | null;
  description: string | null;
  ncm: string | null;
  exporter_code: string | null;
  import_purpose: ImportPurpose | null;
  cfop: string | null;
  cfop_source: string | null;
  tax_rule: {
    id: string;
    name: string;
    active: boolean;
    revision: number;
    applied_revision: number | null;
  } | null;
  status: NfeItemClassificationStatus;
  rule_candidates: NfeItemRuleCandidate[];
  classified_by: { id: string; name: string } | null;
  updated_at: string | null;
};

export type NfeItemClassificationState = {
  process_id: string;
  snapshot_id: string;
  items: NfeItemClassification[];
  total_items: number;
  classified_count: number;
  pending_count: number;
  purpose_counts: Partial<Record<ImportPurpose, number>>;
  registration_date: string | null;
  has_classifications: boolean;
  ready_for_draft: boolean;
  latest_updated_at: string | null;
};

export type SaveNfeItemClassificationsPayload = {
  duimp_snapshot_id: string;
  items: Array<{
    duimp_item_number: string;
    import_purpose: ImportPurpose;
    tax_rule_id?: string;
  }>;
};

export type NfeSharedCosts = {
  afrmm?: string;
  siscomex_fee?: string;
  thc?: string;
  other?: string;
};

export type NfePlannedDocumentItem = {
  id: string;
  duimp_item_number: string;
  exporter_code: string | null;
  import_purpose: ImportPurpose;
  cfop: string;
  customs_value: string;
  allocated_shared_costs: NfeSharedCosts;
};

export type NfePlannedDocument = {
  id: string;
  ordinal: number;
  status: string;
  exporter_key: string;
  exporter_code: string | null;
  foreign_supplier: {
    name?: string | null;
    legal_name?: string | null;
    foreign_tax_id?: string | null;
    country_name?: string | null;
  } | null;
  operation_nature: string;
  item_purposes: ImportPurpose[];
  mixed_import_purposes: boolean;
  items_count: number;
  customs_value: string;
  allocated_shared_costs: NfeSharedCosts;
  totals: {
    customs_value?: string;
    shared_costs?: string;
    planned_value?: string;
  };
  draft: NfeDraftSummary | null;
  items: NfePlannedDocumentItem[];
};

export type NfeValidationIssue = {
  field?: string;
  code?: string;
  message?: string;
  severity?: string;
  blocking?: boolean;
  [key: string]: unknown;
};

export type NfeXmlSummary = {
  id: string;
  version_number: number;
  xml_type: string;
  xsd_valid: boolean | null;
  xsd_errors: Array<{ message?: string; line?: number | null; [key: string]: unknown }> | null;
  generated_at: string | null;
};

export type NfeChildXmlResult = {
  planned_document_id: string;
  draft_id?: string;
  xml_version_id?: string;
  success: boolean;
  xsd_valid?: boolean;
  xsd_errors?: NfeXmlSummary["xsd_errors"];
  message?: string;
};

export type GenerateNfeChildXmlsResult = {
  all_valid: boolean;
  results: NfeChildXmlResult[];
  plan: NfeDocumentPlan;
};

export type NfeDraftSummary = {
  id: string;
  status: string;
  number: number | null;
  series: string;
  access_key: string | null;
  validation_errors: NfeValidationIssue[] | null;
  validation_warnings: NfeValidationIssue[] | null;
  latest_xml: NfeXmlSummary | null;
  signed_xml?: Pick<NfeXmlSummary, "id" | "version_number" | "xml_type" | "xsd_valid" | "generated_at"> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type NfeDraftRecord = NfeDraftSummary & {
  organization_id: string;
  import_process_id: string;
  importer_id: string;
  duimp_snapshot_id: string | null;
  planned_document_id: string | null;
  model: string;
  purpose: string;
  operation_type: string;
  environment: "production";
  fiscal_payload: Record<string, unknown>;
};

export type NfeDraftItem = {
  id: string;
  nfe_draft_id: string;
  item_number: number;
  duimp_item_number: string | null;
  product_code: string | null;
  description: string;
  ncm: string;
  cfop: string;
  cest?: string | null;
  commercial_unit: string;
  commercial_quantity: string;
  commercial_unit_value: string;
  taxable_unit: string;
  taxable_quantity: string;
  taxable_unit_value: string;
  product_value: string;
  freight_value: string;
  insurance_value: string;
  discount_value: string;
  other_value: string;
  import_payload: Record<string, unknown> | null;
  tax_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type NfeDraftDetail = {
  draft: NfeDraftRecord;
  items: NfeDraftItem[];
  xmlVersions: Array<Record<string, unknown>>;
  auditTrail: Array<Record<string, unknown>>;
};

export type GenerateNfeChildDraftsResult = {
  created_draft_ids: string[];
  reused_draft_ids: string[];
  plan: NfeDocumentPlan;
};

export type NfeDraftValidation = {
  valid: boolean;
  errors: NfeValidationIssue[];
  warnings: NfeValidationIssue[];
};

export type UpdateNfeDraftPayload = {
  document?: {
    operation_nature?: string | null;
    presence_indicator?: string | null;
    intermediary_indicator?: string | null;
  };
  issuer?: { state_registration?: string | null };
  foreign_supplier?: {
    legal_name?: string | null;
    foreign_id?: string | null;
    country_code?: string | null;
    country_name?: string | null;
    country_iso_alpha_2?: string | null;
    address?: {
      street?: string | null;
      number?: string | null;
      complement?: string | null;
      district?: string | null;
      city_name?: string | null;
    };
  };
  transport?: {
    freight_mode?: string;
    carrier?: {
      tax_id?: string | null;
      name?: string | null;
      state_registration?: string | null;
      address?: string | null;
      city_name?: string | null;
      state?: string | null;
    } | null;
    volume?: {
      quantity?: number | null;
      species?: string | null;
      brand?: string | null;
      numbering?: string | null;
      net_weight?: string | null;
      gross_weight?: string | null;
    } | null;
  };
  payment?: {
    payment_indicator?: string;
    method?: string;
    description?: string | null;
    value?: string | null;
  };
  additional_info?: {
    automatic_summary?: boolean;
    fiscal?: string | null;
    complementary?: string | null;
    legal_text?: string | null;
  };
  additional_costs?: NfeSharedCosts;
};

export type UpdateNfeDraftItemPayload = {
  product_code?: string;
  description?: string;
  ncm?: string;
  cfop?: string;
  cest?: string | null;
  commercial_unit?: string;
  commercial_quantity?: string;
  commercial_unit_value?: string;
  taxable_unit?: string;
  taxable_quantity?: string;
  taxable_unit_value?: string;
  product_value?: string;
  freight_value?: string;
  insurance_value?: string;
  discount_value?: string;
  other_value?: string;
  import_payload?: Record<string, unknown> | null;
};

export type AdjustNfeDraftItemTaxPayload = {
  source: "manual_adjustment";
  reason: string;
  cfop?: string;
  icms: {
    cst: string;
    base: string;
    rate?: string | null;
    reduction_rate?: string | null;
    deferment_rate?: string | null;
  };
};

export type NfeDocumentPlan = {
  id: string;
  process_id: string;
  snapshot_id: string;
  version_number: number;
  status: string;
  allocation_basis: "customs_value";
  shared_costs: NfeSharedCosts;
  totals: {
    documents_count?: number;
    items_count?: number;
    customs_value?: string;
    shared_costs?: string;
    planned_value?: string;
  };
  reconciliation: {
    balanced?: boolean;
    unassigned_items?: number;
    checks?: Array<{
      name: string;
      expected: string;
      allocated: string;
      difference: string;
      balanced: boolean;
    }>;
  };
  master: {
    type: "managerial";
    is_fiscal_document: false;
    has_number: false;
    has_access_key: false;
    has_xml: false;
  };
  progress: {
    documents_count: number;
    drafts_count: number;
    xmls_count: number;
    xsd_valid_count: number;
    signed_count: number;
    all_drafts_created: boolean;
    all_xmls_generated: boolean;
    all_xmls_valid: boolean;
    all_signed: boolean;
  };
  documents: NfePlannedDocument[];
  created_by: { id: string; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type NfeDocumentPlanState = {
  process_id: string;
  snapshot_id: string;
  plan: NfeDocumentPlan | null;
};

export type CreateNfeDocumentPlanPayload = {
  duimp_snapshot_id: string;
  additional_costs: NfeSharedCosts;
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
  const response = await apiClient.get<ImportProcessRecord>(
    routes.backend.importProcess.detail(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function createImportProcess(
  accessToken: string,
  payload: CreateImportProcessPayload,
) {
  const response = await apiClient.post<ImportProcessRecord>(
    routes.backend.importProcess.list,
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateImportProcess(
  accessToken: string,
  id: string,
  payload: UpdateImportProcessPayload,
) {
  const response = await apiClient.put<ImportProcessRecord>(
    routes.backend.importProcess.detail(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeWorkflowState(accessToken: string, id: string) {
  const response = await apiClient.get<NfeWorkflowState>(
    routes.backend.importProcess.workflowState(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function fetchProcessDuimp(accessToken: string, id: string) {
  const response = await apiClient.post<DuimpFetchResult>(
    routes.backend.importProcess.duimpFetch(id),
    {
      provider_environment: "production",
      source_provider: "portal_unico",
      enrich_catalog: true,
    },
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function listDuimpSnapshots(accessToken: string, id: string) {
  const response = await apiClient.get<Array<Omit<DuimpSnapshotDetails, "normalized"> & {
    normalized_payload?: Record<string, unknown> | null;
  }>>(
    routes.backend.importProcess.duimpSnapshots(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeContext(
  accessToken: string,
  id: string,
  snapshotId?: string,
) {
  const response = await apiClient.get<NfeContextState>(
    routes.backend.importProcess.nfeContext(id),
    {
      ...bearerConfig(accessToken),
      params: snapshotId ? { duimp_snapshot_id: snapshotId } : undefined,
    },
  );
  return response.data;
}

export async function resolveNfeContext(
  accessToken: string,
  id: string,
  payload: ResolveNfeContextPayload,
) {
  const response = await apiClient.post<NfeContextState>(
    routes.backend.importProcess.nfeContextResolve(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeItemClassifications(
  accessToken: string,
  id: string,
  snapshotId?: string,
) {
  const response = await apiClient.get<NfeItemClassificationState>(
    routes.backend.importProcess.itemClassifications(id),
    {
      ...bearerConfig(accessToken),
      params: snapshotId ? { duimp_snapshot_id: snapshotId } : undefined,
    },
  );
  return response.data;
}

export async function saveNfeItemClassifications(
  accessToken: string,
  id: string,
  payload: SaveNfeItemClassificationsPayload,
) {
  const response = await apiClient.put<NfeItemClassificationState>(
    routes.backend.importProcess.itemClassifications(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeDocumentPlan(
  accessToken: string,
  id: string,
  snapshotId?: string,
) {
  const response = await apiClient.get<NfeDocumentPlanState>(
    routes.backend.importProcess.documentPlan(id),
    {
      ...bearerConfig(accessToken),
      params: snapshotId ? { duimp_snapshot_id: snapshotId } : undefined,
    },
  );
  return response.data;
}

export async function createNfeDocumentPlan(
  accessToken: string,
  id: string,
  payload: CreateNfeDocumentPlanPayload,
) {
  const response = await apiClient.post<NfeDocumentPlan>(
    routes.backend.importProcess.documentPlan(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function generateNfeChildDrafts(
  accessToken: string,
  id: string,
  snapshotId: string,
) {
  const response = await apiClient.post<GenerateNfeChildDraftsResult>(
    routes.backend.importProcess.documentPlanDrafts(id),
    {
      duimp_snapshot_id: snapshotId,
      environment: "production",
      series: "1",
    },
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getNfeDraft(
  accessToken: string,
  draftId: string,
) {
  const response = await apiClient.get<NfeDraftDetail>(
    routes.backend.importProcess.draft(draftId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateNfeDraft(
  accessToken: string,
  draftId: string,
  payload: UpdateNfeDraftPayload,
) {
  const response = await apiClient.patch(
    routes.backend.importProcess.draft(draftId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateNfeDraftItem(
  accessToken: string,
  draftId: string,
  itemId: string,
  payload: UpdateNfeDraftItemPayload,
) {
  const response = await apiClient.patch<NfeDraftItem>(
    routes.backend.importProcess.draftItem(draftId, itemId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function adjustNfeDraftItemTax(
  accessToken: string,
  draftId: string,
  itemId: string,
  payload: AdjustNfeDraftItemTaxPayload,
) {
  const response = await apiClient.patch(
    routes.backend.importProcess.draftItemTaxAdjustment(draftId, itemId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function validateNfeDraft(
  accessToken: string,
  draftId: string,
) {
  const response = await apiClient.post<NfeDraftValidation>(
    routes.backend.importProcess.draftValidate(draftId),
    {},
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function generateNfeChildXmls(
  accessToken: string,
  id: string,
  snapshotId: string,
) {
  const response = await apiClient.post<GenerateNfeChildXmlsResult>(
    routes.backend.importProcess.documentPlanXmls(id),
    { duimp_snapshot_id: snapshotId },
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function downloadNfeChildXmlBundle(
  accessToken: string,
  id: string,
  snapshotId: string,
) {
  return apiClient.get<ArrayBuffer>(
    routes.backend.importProcess.documentPlanXmlDownload(id),
    {
      ...bearerConfig(accessToken),
      params: { duimp_snapshot_id: snapshotId },
      responseType: "arraybuffer",
    },
  );
}

export async function downloadNfeDraftXml(
  accessToken: string,
  draftId: string,
  versionId: string,
) {
  return apiClient.get<ArrayBuffer>(
    routes.backend.importProcess.draftXmlDownload(draftId, versionId),
    { ...bearerConfig(accessToken), responseType: "arraybuffer" },
  );
}

export async function signNfeDraftXml(
  accessToken: string,
  draftId: string,
  versionId: string,
  certificateId: string,
) {
  const response = await apiClient.post<{
    xml_version: NfeXmlSummary;
    replayed: boolean;
    issuance: { status: string };
  }>(
    routes.backend.importProcess.draftXmlSign(draftId, versionId),
    { certificate_id: certificateId },
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function downloadDanfePreview(
  accessToken: string,
  draftId: string,
  versionId: string,
) {
  return apiClient.get<ArrayBuffer>(
    routes.backend.importProcess.draftDanfePreview(draftId, versionId),
    { ...bearerConfig(accessToken), responseType: "arraybuffer" },
  );
}
