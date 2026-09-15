import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export type Organization = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

export async function getCurrentOrganization(accessToken: string) {
  const response = await apiClient.get<{ organization: Organization }>(
    routes.backend.organization.me,
    bearerConfig(accessToken),
  );
  return response.data.organization;
}
