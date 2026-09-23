import type {
  ConfigurePortalUnicoPayload,
  PortalUnicoSettings,
} from "@/lib/api/organization";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function configurePortalUnico(
  payload: ConfigurePortalUnicoPayload,
) {
  const response = await bffClient.put<PortalUnicoSettings>(
    routes.bff.organization.portalUnico,
    payload,
  );
  return response.data;
}

export async function testPortalUnicoConnection() {
  const response = await bffClient.post<PortalUnicoSettings>(
    routes.bff.organization.portalUnicoTest,
  );
  return response.data;
}
