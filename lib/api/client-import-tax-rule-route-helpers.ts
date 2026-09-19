import "server-only";

import { NextResponse } from "next/server";

import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";

export async function readTaxRuleJson(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return payload;
}

export function invalidTaxRulePayloadResponse() {
  return NextResponse.json(
    {
      error: "invalid_payload",
      message: "Envie um objeto JSON válido para a regra tributária.",
    },
    { status: 400 },
  );
}

export function taxRuleApiErrorResponse(operation: string, error: unknown) {
  return clientApiErrorResponse(operation, error);
}
