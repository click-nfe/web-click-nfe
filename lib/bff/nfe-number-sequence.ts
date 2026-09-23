import type {
  NfeNumberSequence,
  UpsertNfeNumberSequencePayload,
} from "@/lib/api/nfe-number-sequence";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function listNfeNumberSequences(clientId: string) {
  const response = await bffClient.get<NfeNumberSequence[]>(
    routes.bff.client.nfeNumberSequences(clientId),
  );
  return response.data;
}

export async function upsertNfeNumberSequence(
  clientId: string,
  payload: UpsertNfeNumberSequencePayload,
) {
  const response = await bffClient.put<NfeNumberSequence>(
    routes.bff.client.nfeNumberSequences(clientId),
    payload,
  );
  return response.data;
}
