import type { ImportProcessStatus } from "@/lib/api/import-process";

export const importProcessStatusLabels: Record<ImportProcessStatus, string> = {
  created: "Criado",
  duimp_fetching: "Buscando DUIMP",
  duimp_fetched: "DUIMP recebida",
  duimp_fetch_failed: "Falha na DUIMP",
  duimp_normalized: "DUIMP normalizada",
  fiscal_draft_created: "Minuta criada",
  draft_validation_failed: "Minuta com falha",
  draft_ready: "Minuta pronta",
  xml_generated: "XML gerado",
  xml_validation_failed: "XML com falha",
  xml_validated: "XML validado",
  xml_signed: "XML assinado",
  transmission_pending: "Transmissão pendente",
  transmitted: "Transmitido",
  authorized: "Autorizado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export const importProcessStatusGroups = {
  danger: new Set<ImportProcessStatus>([
    "duimp_fetch_failed",
    "draft_validation_failed",
    "xml_validation_failed",
    "rejected",
    "failed",
  ]),
  success: new Set<ImportProcessStatus>([
    "draft_ready",
    "xml_generated",
    "xml_validated",
    "xml_signed",
    "authorized",
  ]),
  neutral: new Set<ImportProcessStatus>(["cancelled"]),
};

export const nextActionLabels: Record<string, string> = {
  configure_fiscal_profile: "Configurar perfil fiscal",
  configure_tax_rule: "Configurar regra tributária",
  configure_number_sequence: "Configurar numeração",
  configure_provider_connection: "Conectar Portal Único",
  fetch_duimp: "Buscar DUIMP",
  resolve_context: "Revisar contexto fiscal",
  classify_items: "Classificar itens",
  create_document_plan: "Criar plano de notas",
  review_document_plan: "Revisar plano de notas",
  create_child_drafts: "Criar minutas",
  create_draft: "Criar minuta",
  correct_child_drafts: "Corrigir minutas",
  correct_draft: "Corrigir minuta",
  generate_child_xmls: "Gerar XMLs",
  validate_child_xmls: "Validar XMLs",
  generate_access_key: "Gerar chave de acesso",
  generate_xml: "Gerar XML",
  validate_xml: "Validar XML",
  completed: "Processo concluído",
};

export function importProcessStatusClass(status: ImportProcessStatus) {
  if (importProcessStatusGroups.danger.has(status)) {
    return "bg-destructive/10 text-destructive";
  }
  if (importProcessStatusGroups.success.has(status)) {
    return "bg-sage-soft text-sage-strong";
  }
  if (importProcessStatusGroups.neutral.has(status)) {
    return "bg-muted text-muted-foreground";
  }
  return "bg-secondary text-secondary-foreground";
}

export function formatProcessDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
