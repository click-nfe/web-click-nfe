const API_URL = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export type UserIdentity = {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "user" | string;
  setor: string | null;
  tipo: "user";
  organizationId: string;
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

export function backendFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
}

export function bearerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
