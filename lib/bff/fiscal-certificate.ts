import type { FiscalCertificateRecord } from "@/lib/api/fiscal-certificate";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function uploadFiscalCertificate(
  clientId: string,
  certificate: File,
  password: string,
) {
  const data = new FormData();
  data.set("certificate", certificate);
  data.set("password", password);
  data.set("environment", "production");
  const response = await bffClient.post<FiscalCertificateRecord>(
    routes.bff.client.fiscalCertificates(clientId),
    data,
  );
  return response.data;
}

export async function validateFiscalCertificate(
  clientId: string,
  certificateId: string,
) {
  const response = await bffClient.post<FiscalCertificateRecord>(
    routes.bff.client.fiscalCertificateValidate(clientId, certificateId),
  );
  return response.data;
}

export async function activateFiscalCertificate(
  clientId: string,
  certificateId: string,
) {
  const response = await bffClient.post<FiscalCertificateRecord>(
    routes.bff.client.fiscalCertificateActivate(clientId, certificateId),
  );
  return response.data;
}
