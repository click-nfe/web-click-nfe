import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  getImportProcess,
  type UpdateImportProcessPayload,
  updateImportProcess,
} from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseUpdatePayload(value: unknown): UpdateImportProcessPayload | null {
  if (
    !isObject(value) ||
    typeof value.duimp_number !== "string" ||
    !value.duimp_number.trim() ||
    value.source !== "portal_unico"
  ) {
    return null;
  }
  const compact = value.duimp_number.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!/^[0-9]{2}BR[0-9]{11}$/.test(compact)) return null;
  return {
    duimp_number: `${compact.slice(0, -1)}-${compact.slice(-1)}`,
    source: "portal_unico",
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
    return NextResponse.json(await getImportProcess(token, id));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.get", error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = parseUpdatePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Informe um número de DUIMP válido." },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await updateImportProcess(token, id, payload));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.update", error);
  }
}
