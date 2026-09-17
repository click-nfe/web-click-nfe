import "server-only";

import axios from "axios";
import { NextResponse } from "next/server";

import type {
  CreateClientPayload,
  UpdateClientPayload,
} from "@/lib/api/client-record";
import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";

const optionalTextFields = [
  "nome_resumido",
  "inscricao_estadual",
  "inscricao_municipal",
  "endereco_completo_escritorio",
  "endereco_completo_armazem",
  "cnae_principal",
  "cnae_secundario",
  "regime_tributacao",
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" ? value : undefined;
}

export function parseCreateClientPayload(value: unknown): CreateClientPayload | null {
  if (!isObject(value)) return null;
  if (typeof value.cnpj !== "string" || typeof value.razao_social !== "string") {
    return null;
  }

  const payload: CreateClientPayload = {
    cnpj: value.cnpj,
    razao_social: value.razao_social,
  };
  for (const field of optionalTextFields) {
    const parsed = optionalText(value[field]);
    if (parsed === undefined && value[field] !== undefined) return null;
    if (value[field] !== undefined) payload[field] = parsed;
  }
  if (value.ativo !== undefined) {
    if (typeof value.ativo !== "boolean") return null;
    payload.ativo = value.ativo;
  }
  return payload;
}

export function parseUpdateClientPayload(value: unknown): UpdateClientPayload | null {
  if (!isObject(value)) return null;
  const payload: UpdateClientPayload = {};

  if (value.razao_social !== undefined) {
    if (typeof value.razao_social !== "string") return null;
    payload.razao_social = value.razao_social;
  }
  for (const field of optionalTextFields) {
    const parsed = optionalText(value[field]);
    if (parsed === undefined && value[field] !== undefined) return null;
    if (value[field] !== undefined) payload[field] = parsed;
  }
  if (value.ativo !== undefined) {
    if (typeof value.ativo !== "boolean") return null;
    payload.ativo = value.ativo;
  }
  return payload;
}

export function clientApiErrorResponse(operation: string, error: unknown) {
  logApiError(operation, error);

  if (hasApiStatus(error, 401, 403)) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }
  if (hasApiStatus(error, 404)) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (
    axios.isAxiosError(error) &&
    error.response &&
    [400, 409].includes(error.response.status) &&
    isObject(error.response.data)
  ) {
    return NextResponse.json(error.response.data, {
      status: error.response.status,
    });
  }

  return NextResponse.json(
    { error: apiUnavailableMessage(error) },
    { status: 502 },
  );
}
