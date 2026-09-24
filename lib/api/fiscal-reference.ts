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

export type FiscalMunicipality = {
  code: string;
  name: string;
  state: string;
  active: boolean;
  updated_at: string;
};

export type FiscalCountry = {
  bacen_code: string;
  iso_alpha_2: string | null;
  iso_alpha_3: string | null;
  name: string;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  updated_at: string;
};

export type FiscalReferenceList<T> = {
  items: T[];
  total: number;
  limit: number;
  q: string;
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

export async function searchMunicipalities(
  accessToken: string,
  query: string,
  state?: string,
) {
  const response = await apiClient.get<FiscalReferenceList<FiscalMunicipality>>(
    routes.backend.fiscalReference.municipalities,
    {
      ...bearerConfig(accessToken),
      params: { q: query, state: state || undefined, limit: 12 },
    },
  );
  return response.data;
}

export async function searchCountries(
  accessToken: string,
  query: string,
  activeOn?: string,
) {
  const response = await apiClient.get<FiscalReferenceList<FiscalCountry>>(
    routes.backend.fiscalReference.countries,
    {
      ...bearerConfig(accessToken),
      params: { q: query, active_on: activeOn || undefined, limit: 12 },
    },
  );
  return response.data;
}
