import "server-only";

import axios from "axios";
import { NextResponse } from "next/server";

import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function importProcessApiErrorResponse(operation: string, error: unknown) {
  logApiError(operation, error);

  if (hasApiStatus(error, 401)) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }
  if (hasApiStatus(error, 403)) {
    return NextResponse.json(
      { error: "forbidden", message: "Você não tem acesso a este processo." },
      { status: 403 },
    );
  }
  if (hasApiStatus(error, 404)) {
    return NextResponse.json(
      { error: "not_found", message: "Processo não encontrado." },
      { status: 404 },
    );
  }
  if (
    axios.isAxiosError(error) &&
    error.response &&
    [400, 409, 422].includes(error.response.status) &&
    isObject(error.response.data)
  ) {
    return NextResponse.json(error.response.data, { status: error.response.status });
  }
  if (
    hasApiStatus(error, 503) &&
    axios.isAxiosError(error) &&
    isObject(error.response?.data) &&
    error.response?.data.error === "xsd_schema_unavailable"
  ) {
    return NextResponse.json(error.response.data, { status: 503 });
  }
  if (hasApiStatus(error, 502, 503)) {
    return NextResponse.json(
      {
        error: "external_integration_error",
        message: "Não foi possível concluir a consulta ao Portal Único.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({ error: apiUnavailableMessage(error) }, { status: 502 });
}
