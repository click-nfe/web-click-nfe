import type { AxiosRequestConfig } from "axios";

import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type ClientRecord = {
  id: string;
  organization_id: string;
  cnpj: string;
  razao_social: string;
  nome_resumido: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  endereco_completo_escritorio: string | null;
  endereco_completo_armazem: string | null;
  cnae_principal: string | null;
  cnae_secundario: string | null;
  regime_tributacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  contatos: Array<{
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    whatsapp: string | null;
    cargo_departamento: string | null;
    principal: boolean;
    ativo: boolean;
  }>;
};

export type ClientListParams = {
  query?: string;
  cnpj?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
};

export type ClientListResponse = {
  items: ClientRecord[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateClientPayload = {
  cnpj: string;
  razao_social: string;
  nome_resumido?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  endereco_completo_escritorio?: string | null;
  endereco_completo_armazem?: string | null;
  cnae_principal?: string | null;
  cnae_secundario?: string | null;
  regime_tributacao?: string | null;
  ativo?: boolean;
};

export type UpdateClientPayload = Partial<
  Omit<CreateClientPayload, "cnpj">
>;

export type CompanyActivity = {
  code: string;
  description: string;
};

export type ClientCompanyLookup = {
  provider: "brasil_api";
  cnpj: string;
  legal_name: string;
  trade_name: string;
  registration_status: string;
  main_activity: CompanyActivity | null;
  secondary_activities: CompanyActivity[];
  address: {
    street_type: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    zip_code: string;
    city_code: string;
  };
  formatted_address: string;
  tax_regime_suggestion: "1" | null;
};

function toBackendParams(params: ClientListParams = {}) {
  return {
    q: params.query,
    cnpj: params.cnpj,
    ativo: params.active,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function listClients(
  accessToken: string,
  params?: ClientListParams,
) {
  const config: AxiosRequestConfig = {
    ...bearerConfig(accessToken),
    params: toBackendParams(params),
  };
  const response = await apiClient.get<ClientListResponse>(
    routes.backend.client.list,
    config,
  );
  return response.data;
}

export async function createClient(
  accessToken: string,
  payload: CreateClientPayload,
) {
  const response = await apiClient.post<ClientRecord>(
    routes.backend.client.list,
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function getClient(accessToken: string, id: string) {
  const response = await apiClient.get<ClientRecord>(
    routes.backend.client.detail(id),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function updateClient(
  accessToken: string,
  id: string,
  payload: UpdateClientPayload,
) {
  const response = await apiClient.patch<ClientRecord>(
    routes.backend.client.detail(id),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function lookupClientCompany(accessToken: string, cnpj: string) {
  const response = await apiClient.get<ClientCompanyLookup>(
    routes.backend.client.cnpjLookup(cnpj),
    bearerConfig(accessToken),
  );
  return response.data;
}
