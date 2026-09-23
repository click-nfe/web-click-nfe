import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  getNfeContext,
  type ResolveNfeContextPayload,
  resolveNfeContext,
} from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function parsePayload(value: unknown): ResolveNfeContextPayload | null {
  if (
    !isObject(value) ||
    typeof value.duimp_snapshot_id !== "string" ||
    !value.duimp_snapshot_id.trim() ||
    typeof value.refresh_external !== "boolean" ||
    !isObject(value.overrides)
  ) {
    return null;
  }

  const source = value.overrides;
  const clearanceLocation = optionalText(source.clearance_location, 255);
  const clearanceState = optionalText(source.clearance_state, 2);
  const clearanceDate = optionalText(source.clearance_date, 10);
  const transportMode = optionalText(source.transport_mode_code, 2);
  if (
    clearanceLocation === null ||
    clearanceState === null ||
    clearanceDate === null ||
    transportMode === null ||
    (clearanceState && !/^[A-Za-z]{2}$/.test(clearanceState)) ||
    (clearanceDate && !/^\d{4}-\d{2}-\d{2}$/.test(clearanceDate)) ||
    (transportMode && !/^(?:[1-9]|1[0-3])$/.test(transportMode))
  ) {
    return null;
  }

  let foreignSupplier: ResolveNfeContextPayload["overrides"]["foreign_supplier"];
  if (source.foreign_supplier !== undefined) {
    if (!isObject(source.foreign_supplier)) return null;
    const name = optionalText(source.foreign_supplier.name, 255);
    const countryCode = optionalText(source.foreign_supplier.country_code, 10);
    const countryName = optionalText(source.foreign_supplier.country_name, 120);
    if (name === null || countryCode === null || countryName === null) return null;
    foreignSupplier = {
      ...(name ? { name } : {}),
      ...(countryCode ? { country_code: countryCode } : {}),
      ...(countryName ? { country_name: countryName } : {}),
    };
  }

  return {
    duimp_snapshot_id: value.duimp_snapshot_id.trim(),
    refresh_external: value.refresh_external,
    overrides: {
      ...(clearanceLocation ? { clearance_location: clearanceLocation } : {}),
      ...(clearanceState ? { clearance_state: clearanceState.toUpperCase() } : {}),
      ...(clearanceDate ? { clearance_date: clearanceDate } : {}),
      ...(transportMode ? { transport_mode_code: transportMode } : {}),
      ...(foreignSupplier && Object.keys(foreignSupplier).length
        ? { foreign_supplier: foreignSupplier }
        : {}),
    },
  };
}

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function GET(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id } = await context.params;
  const snapshotId = request.nextUrl.searchParams.get("duimp_snapshot_id") || undefined;
  try {
    return NextResponse.json(await getNfeContext(token, id, snapshotId));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.nfe-context.get", error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Revise os dados do contexto fiscal." },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await resolveNfeContext(token, id, payload));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.nfe-context.resolve", error);
  }
}
