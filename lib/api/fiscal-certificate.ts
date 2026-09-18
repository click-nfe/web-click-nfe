import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type FiscalCertificateEnvironment = "homologation" | "production";
export type FiscalCertificateStatus =
  | "pending_validation"
  | "active"
  | "expired"
  | "revoked"
  | "disabled"
  | "invalid";

export type FiscalCertificateRecord = {
  id: string;
  organization_id: string;
  client_id: string;
  environment: FiscalCertificateEnvironment;
  provider:
    | "local_encrypted_file"
    | "gcp_secret_manager"
    | "gcp_cloud_storage";
  status: FiscalCertificateStatus;
  issuer_cnpj: string;
  certificate_fingerprint_sha256: string | null;
  certificate_serial_number: string | null;
  subject_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  last_validated_at: string | null;
  validation_error: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function listFiscalCertificates(
  accessToken: string,
  clientId: string,
) {
  const response = await apiClient.get<FiscalCertificateRecord[]>(
    routes.backend.client.fiscalCertificates(clientId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function uploadFiscalCertificate(
  accessToken: string,
  clientId: string,
  data: FormData,
) {
  const response = await apiClient.post<FiscalCertificateRecord & { valid: true }>(
    routes.backend.client.fiscalCertificateUpload(clientId),
    data,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function validateFiscalCertificate(
  accessToken: string,
  clientId: string,
  certificateId: string,
) {
  const response = await apiClient.post<FiscalCertificateRecord & { valid: true }>(
    routes.backend.client.fiscalCertificateValidate(clientId, certificateId),
    undefined,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function activateFiscalCertificate(
  accessToken: string,
  clientId: string,
  certificateId: string,
) {
  const response = await apiClient.post<FiscalCertificateRecord>(
    routes.backend.client.fiscalCertificateActivate(clientId, certificateId),
    undefined,
    bearerConfig(accessToken),
  );
  return response.data;
}
