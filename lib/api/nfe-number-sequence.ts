import { routes } from "@/lib/api/routes";
import { apiClient, bearerConfig } from "@/lib/api/server-client";

export type NfeNumberSequence = {
  id: string;
  organization_id: string;
  client_id: string;
  environment: "production" | "homologation";
  model: "55";
  series: string;
  current_number: number;
  initial_number: number;
  max_number: number;
  status: "active" | "inactive";
  last_reserved_number: number | null;
  last_reserved_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type UpsertNfeNumberSequencePayload = {
  environment: "production";
  model: "55";
  series: string;
  current_number?: number;
  initial_number: number;
  max_number: number;
  status: "active" | "inactive";
};

export async function listNfeNumberSequences(
  accessToken: string,
  clientId: string,
) {
  const response = await apiClient.get<NfeNumberSequence[]>(
    routes.backend.client.nfeNumberSequences(clientId),
    bearerConfig(accessToken),
  );
  return response.data;
}

export async function upsertNfeNumberSequence(
  accessToken: string,
  clientId: string,
  payload: UpsertNfeNumberSequencePayload,
) {
  const response = await apiClient.put<NfeNumberSequence>(
    routes.backend.client.nfeNumberSequences(clientId),
    payload,
    bearerConfig(accessToken),
  );
  return response.data;
}
