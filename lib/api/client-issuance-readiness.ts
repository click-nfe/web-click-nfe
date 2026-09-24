import type { FiscalCertificateRecord } from "@/lib/api/fiscal-certificate";
import type { NfeNumberSequence } from "@/lib/api/nfe-number-sequence";

export type ClientIssuanceReadinessSnapshot = {
  client_id: string;
  environment: "production";
  has_fiscal_profile: boolean;
  active_sequence: NfeNumberSequence | null;
  has_portal_connection: boolean;
  active_tax_rules: number;
  tax_rule_conflicts: number;
  active_certificate: FiscalCertificateRecord | null;
  refreshed_at: string;
};
