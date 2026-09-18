import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type PostalCodeLookup = {
  zip_code: string;
  street: string;
  complement: string;
  district: string;
  city_code: string;
  city_name: string;
  state: string;
  country_code: string;
  country_name: string;
  provider: string;
  cache_hit: boolean;
  stale: boolean;
  fetched_at: string;
};

export async function lookupPostalCode(
  accessToken: string,
  zipCode: string,
) {
  const response = await apiClient.get<PostalCodeLookup>(
    routes.backend.fiscalReference.postalCode(zipCode),
    bearerConfig(accessToken),
  );
  return response.data;
}
