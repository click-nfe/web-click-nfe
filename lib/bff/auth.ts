import axios from "axios";

import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

type LoginCredentials = {
  email: string;
  password: string;
};

export async function login(credentials: LoginCredentials) {
  const response = await bffClient.post(routes.bff.auth.login, credentials);
  return response.data;
}

export function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível conectar. Tente novamente.";
  }
  return "Não foi possível conectar. Tente novamente.";
}
