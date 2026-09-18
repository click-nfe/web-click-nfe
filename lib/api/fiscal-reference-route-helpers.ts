import "server-only";

import axios from "axios";
import { NextResponse } from "next/server";

import {
  apiUnavailableMessage,
  hasApiStatus,
  logApiError,
} from "@/lib/api/errors";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function fiscalReferenceApiErrorResponse(
  operation: string,
  error: unknown,
) {
  logApiError(operation, error);

  if (hasApiStatus(error, 401)) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }
  if (
    axios.isAxiosError(error) &&
    error.response &&
    [400, 403, 404, 503].includes(error.response.status) &&
    isObject(error.response.data)
  ) {
    return NextResponse.json(error.response.data, {
      status: error.response.status,
    });
  }
  if (hasApiStatus(error, 404)) {
    return NextResponse.json(
      {
        error: "postal_code_route_unavailable",
        message:
          "A API em execução ainda não possui a consulta de CEP. Atualize e recrie o container da API.",
      },
      { status: 502 },
    );
  }
  if (hasApiStatus(error, 403)) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Você não tem permissão para consultar referências fiscais.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: apiUnavailableMessage(error) },
    { status: 502 },
  );
}
