import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";
import {
  importProcessStatuses,
  listImportProcesses,
  type ImportProcessListParams,
  type ImportProcessStatus,
} from "@/lib/api/import-process";

export const dynamic = "force-dynamic";

function optionalInteger(value: string | null) {
  if (value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) ? number : Number.NaN;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const status = search.get("status");
  const limit = optionalInteger(search.get("limit"));
  const offset = optionalInteger(search.get("offset"));

  if (
    (status && !importProcessStatuses.includes(status as ImportProcessStatus)) ||
    Number.isNaN(limit) ||
    Number.isNaN(offset) ||
    (limit !== undefined && (limit < 1 || limit > 100)) ||
    (offset !== undefined && offset < 0)
  ) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
  }

  const params: ImportProcessListParams = {
    status: (status || undefined) as ImportProcessStatus | undefined,
    source: search.get("source") || undefined,
    importerId: search.get("importer_id") || undefined,
    duimpNumber: search.get("duimp_number") || undefined,
    query: search.get("q")?.trim() || undefined,
    createdByMe: search.get("created_by_me") === "true" || undefined,
    limit,
    offset,
  };

  try {
    return NextResponse.json(await listImportProcesses(accessToken, params));
  } catch (error) {
    logApiError("import-process.list", error);

    if (hasApiStatus(error, 401, 403)) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }
    if (hasApiStatus(error, 400, 422)) {
      return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
    }
    return NextResponse.json(
      { error: apiUnavailableMessage(error) },
      { status: 502 },
    );
  }
}
