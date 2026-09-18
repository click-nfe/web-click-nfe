import axios from "axios";

import type {
  ClientFiscalProfile,
  UpsertClientFiscalProfilePayload,
} from "@/lib/api/client-fiscal-profile";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function getClientFiscalProfile(clientId: string) {
  try {
    const response = await bffClient.get<ClientFiscalProfile>(
      routes.bff.client.fiscalProfile(clientId),
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertClientFiscalProfile(
  clientId: string,
  payload: UpsertClientFiscalProfilePayload,
) {
  const response = await bffClient.put<ClientFiscalProfile>(
    routes.bff.client.fiscalProfile(clientId),
    payload,
  );
  return response.data;
}
