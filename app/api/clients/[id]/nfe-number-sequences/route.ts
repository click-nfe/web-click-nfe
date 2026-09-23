import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import {
  listNfeNumberSequences,
  type UpsertNfeNumberSequencePayload,
  upsertNfeNumberSequence,
} from "@/lib/api/nfe-number-sequence";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePayload(value: unknown): UpsertNfeNumberSequencePayload | null {
  if (!isObject(value)) return null;
  if (
    value.environment !== "production" ||
    value.model !== "55" ||
    typeof value.series !== "string" ||
    typeof value.initial_number !== "number" ||
    typeof value.max_number !== "number" ||
    (value.status !== "active" && value.status !== "inactive")
  ) {
    return null;
  }
  if (
    !value.series.trim() ||
    !Number.isInteger(value.initial_number) ||
    !Number.isInteger(value.max_number) ||
    value.initial_number < 1 ||
    value.max_number < value.initial_number ||
    value.max_number > 999999999
  ) {
    return null;
  }
  if (
    value.current_number !== undefined &&
    (!Number.isInteger(value.current_number) ||
      (value.current_number as number) < 0 ||
      (value.current_number as number) > 999999999)
  ) {
    return null;
  }

  return {
    environment: "production",
    model: "55",
    series: value.series.trim(),
    initial_number: value.initial_number,
    max_number: value.max_number,
    status: value.status,
    ...(value.current_number === undefined
      ? {}
      : { current_number: value.current_number as number }),
  };
}

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function GET(_request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await listNfeNumberSequences(token, id));
  } catch (error) {
    return clientApiErrorResponse("client.nfe-number-sequence.list", error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Dados da sequência NF-e inválidos." },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await upsertNfeNumberSequence(token, id, payload));
  } catch (error) {
    return clientApiErrorResponse("client.nfe-number-sequence.upsert", error);
  }
}
