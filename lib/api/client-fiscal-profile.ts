import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type ClientFiscalProfile = {
  id: string;
  organization_id: string;
  client_id: string;
  legal_name: string;
  trade_name: string | null;
  cnpj: string;
  state_registration: string | null;
  tax_regime: "1" | "2" | "3";
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city_code: string;
  city_name: string;
  state: string;
  zip_code: string;
  country_code: string;
  country_name: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type UpsertClientFiscalProfilePayload = {
  legal_name: string;
  trade_name: string | null;
  cnpj: string;
  state_registration: string | null;
  tax_regime: "1" | "2" | "3";
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city_code: string;
  city_name: string;
  state: string;
  zip_code: string;
  country_code: string;
  country_name: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
};

export async function getClientFiscalProfile(
  accessToken: string,
  clientId: string,
) {
  const response = await apiClient.get<ClientFiscalProfile>(
    routes.backend.client.fiscalProfile(clientId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function upsertClientFiscalProfile(
  accessToken: string,
  clientId: string,
  payload: UpsertClientFiscalProfilePayload,
) {
  const response = await apiClient.put<ClientFiscalProfile>(
    routes.backend.client.fiscalProfile(clientId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}
