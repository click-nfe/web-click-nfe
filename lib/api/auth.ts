import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export type UserIdentity = {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "user" | string;
  setor: string | null;
  tipo: "user";
  organizationId: string;
  access_tags: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginResponse = {
  user: UserIdentity;
  tokens: AuthTokens;
};

export async function login(email: string, password: string) {
  const response = await apiClient.post<LoginResponse>(routes.backend.auth.login, {
    email,
    password,
  });
  return response.data;
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post<{ tokens: AuthTokens }>(
    routes.backend.auth.refresh,
    { refreshToken },
  );
  return response.data;
}

export async function logout(accessToken: string) {
  await apiClient.post(
    routes.backend.auth.logout,
    undefined,
    bearerConfig(accessToken),
  );
}

export async function getCurrentUser(accessToken: string) {
  const response = await apiClient.get<UserIdentity>(
    routes.backend.auth.me,
    bearerConfig(accessToken),
  );
  return response.data;
}
