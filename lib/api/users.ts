import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export type AccessTag = "clientes" | "processos" | "emissao" | "configuracoes";
export const accessTagLabels: Record<AccessTag, string> = {
  clientes: "Clientes", processos: "Processos", emissao: "Emissão", configuracoes: "Configurações",
};
export type ManagedUser = {
  id: string; nome: string; email: string; role: string; setor: string | null;
  ativo: boolean; access_tags: AccessTag[];
};
export type UserPayload = {
  nome: string; email: string; role: string; setor: string | null;
  ativo: boolean; access_tags: AccessTag[]; password?: string;
};
export async function listUsers(token: string) {
  const response = await apiClient.get<ManagedUser[]>(routes.backend.users.list, bearerConfig(token));
  return response.data;
}
export async function createUser(token: string, payload: UserPayload) {
  const response = await apiClient.post<{ data: ManagedUser }>(routes.backend.users.list, payload, bearerConfig(token));
  return response.data.data;
}
export async function updateUser(token: string, id: string, payload: UserPayload) {
  const response = await apiClient.put<{ data: ManagedUser }>(routes.backend.users.detail(id), payload, bearerConfig(token));
  return response.data.data;
}
