import "server-only";

import axios from "axios";
import { NextResponse } from "next/server";

import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function organizationApiErrorResponse(operation: string, error: unknown) {
  logApiError(operation, error);

  if (hasApiStatus(error, 401)) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }
  if (
    axios.isAxiosError(error) &&
    error.response &&
    [400, 403, 409, 422, 503].includes(error.response.status) &&
    isObject(error.response.data)
  ) {
    return NextResponse.json(error.response.data, {
      status: error.response.status,
    });
  }
  if (hasApiStatus(error, 403)) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Apenas administradores podem alterar esta integração.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: apiUnavailableMessage(error) },
    { status: 502 },
  );
}
