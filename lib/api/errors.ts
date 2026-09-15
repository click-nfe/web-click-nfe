import axios from "axios";

import { getApiTarget } from "@/lib/api/server-client";

export function hasApiStatus(error: unknown, ...statuses: number[]) {
  return (
    axios.isAxiosError(error) &&
    typeof error.response?.status === "number" &&
    statuses.includes(error.response.status)
  );
}

export function logApiError(operation: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    // Não use error.toJSON(): a configuração pode conter Authorization.
    console.error(`[api] ${operation}`, {
      target: getApiTarget(),
      code: error.code ?? null,
      status: error.response?.status ?? null,
      message: error.message,
    });
    return;
  }

  console.error(`[api] ${operation}`, {
    target: getApiTarget(),
    message: error instanceof Error ? error.message : "Erro desconhecido",
  });
}

export function apiUnavailableMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Não foi possível comunicar com a API.";
  }

  if (error.code === "ECONNREFUSED") {
    return "O frontend não conseguiu alcançar a API. Confirme a API_URL e se o Flask está em execução.";
  }

  if (error.code === "ENOTFOUND") {
    return "O endereço configurado em API_URL não pôde ser resolvido.";
  }

  if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
    return "A API demorou mais que o limite configurado para responder.";
  }

  if (error.response) {
    return "A API respondeu com erro ao frontend.";
  }

  return "Não foi possível comunicar com a API.";
}
