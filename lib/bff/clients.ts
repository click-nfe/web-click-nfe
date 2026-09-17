import type {
  ClientListParams,
  ClientListResponse,
  ClientCompanyLookup,
  ClientRecord,
  CreateClientPayload,
  UpdateClientPayload,
} from "@/lib/api/client-record";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export function clientListUrl(params: ClientListParams = {}) {
  const search = new URLSearchParams();
  if (params.query) search.set("q", params.query);
  if (params.cnpj) search.set("cnpj", params.cnpj);
  if (params.active !== undefined) search.set("ativo", String(params.active));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  return `${routes.bff.client.list}${query ? `?${query}` : ""}`;
}

export async function listClients(params?: ClientListParams) {
  const response = await bffClient.get<ClientListResponse>(clientListUrl(params));
  return response.data;
}

export async function createClient(payload: CreateClientPayload) {
  const response = await bffClient.post<ClientRecord>(
    routes.bff.client.list,
    payload,
  );
  return response.data;
}

export async function getClient(id: string) {
  const response = await bffClient.get<ClientRecord>(
    routes.bff.client.detail(id),
  );
  return response.data;
}

export async function updateClient(id: string, payload: UpdateClientPayload) {
  const response = await bffClient.patch<ClientRecord>(
    routes.bff.client.detail(id),
    payload,
  );
  return response.data;
}

export async function lookupClientCompany(cnpj: string) {
  const response = await bffClient.get<ClientCompanyLookup>(
    routes.bff.client.cnpjLookup(cnpj),
  );
  return response.data;
}
