import { bffClient } from "@/lib/bff/client";
import { routes } from "@/lib/api/routes";
import type { ManagedUser, UserPayload } from "@/lib/api/users";

export async function saveUser(payload: UserPayload, id?: string) {
  const response = id
    ? await bffClient.put<ManagedUser>(routes.bff.users.detail(id), payload)
    : await bffClient.post<ManagedUser>(routes.bff.users.list, payload);
  return response.data;
}
