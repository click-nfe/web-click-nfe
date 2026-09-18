import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  getClientFiscalProfile,
  type UpsertClientFiscalProfilePayload,
  upsertClientFiscalProfile,
} from "@/lib/api/client-fiscal-profile";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePayload(value: unknown): UpsertClientFiscalProfilePayload | null {
  if (!isObject(value)) return null;

  const required = [
    "legal_name",
    "cnpj",
    "tax_regime",
    "street",
    "number",
    "district",
    "city_code",
    "city_name",
    "state",
    "zip_code",
    "country_code",
    "country_name",
  ] as const;
  if (required.some((field) => typeof value[field] !== "string")) return null;
  if (!["1", "2", "3"].includes(value.tax_regime as string)) return null;

  const optional = [
    "trade_name",
    "state_registration",
    "complement",
    "phone",
    "email",
  ] as const;
  if (
    optional.some(
      (field) => value[field] !== null && typeof value[field] !== "string",
    )
  ) {
    return null;
  }
  if (typeof value.is_default !== "boolean") return null;

  return value as UpsertClientFiscalProfilePayload;
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
    return NextResponse.json(await getClientFiscalProfile(token, id));
  } catch (error) {
    return clientApiErrorResponse("client.fiscal-profile.get", error);
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
      { error: "invalid_payload", message: "Dados do perfil fiscal inválidos." },
      { status: 400 },
    );
  }
  const { id } = await context.params;

  try {
    return NextResponse.json(
      await upsertClientFiscalProfile(token, id, payload),
    );
  } catch (error) {
    return clientApiErrorResponse("client.fiscal-profile.upsert", error);
  }
}
