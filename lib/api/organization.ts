import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export type Organization = {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

export type PortalUnicoConnectionState =
  | "not_configured"
  | "pending_test"
  | "connected"
  | "error"
  | "inactive";

export type PortalUnicoBlocker = {
  code: string;
  message: string;
};

export type PortalUnicoSettings = {
  connection_id: string | null;
  provider: "portal_unico";
  environment: "production";
  configured: boolean;
  state: PortalUnicoConnectionState;
  ready_for_duimp: boolean;
  role_type: "IMPEXP" | string;
  client_id_hint: string | null;
  credential_storage_provider: string | null;
  last_healthcheck_at: string | null;
  last_error: string | null;
  blockers: PortalUnicoBlocker[];
};

export type ConfigurePortalUnicoPayload = {
  client_id: string;
  client_secret: string;
};

export async function getCurrentOrganization(accessToken: string) {
  const response = await apiClient.get<{ organization: Organization }>(
    routes.backend.organization.me,
    bearerConfig(accessToken),
  );
  return response.data.organization;
}

export type OrganizationUpdate = Pick<Organization, "nome" | "cnpj" | "email" | "telefone">;

export async function updateCurrentOrganization(accessToken: string, payload: OrganizationUpdate) {
  const response = await apiClient.patch<{ organization: Organization }>(
    routes.backend.organization.me, payload, bearerConfig(accessToken),
  );
  return response.data.organization;
}

export async function getPortalUnicoSettings(accessToken: string) {
  const response = await apiClient.get<PortalUnicoSettings>(
    routes.backend.organization.portalUnico,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function configurePortalUnico(
  accessToken: string,
  payload: ConfigurePortalUnicoPayload,
) {
  const response = await apiClient.put<PortalUnicoSettings>(
    routes.backend.organization.portalUnico,
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function testPortalUnicoConnection(accessToken: string) {
  const response = await apiClient.post<PortalUnicoSettings>(
    routes.backend.organization.portalUnicoTest,
    undefined,
    bearerConfig(accessToken),
  );
  return response.data;
}
