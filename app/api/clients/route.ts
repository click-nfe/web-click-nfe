import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import {
  createClient,
  listClients,
  type ClientListParams,
} from "@/lib/api/client-record";
import {
  clientApiErrorResponse,
  parseCreateClientPayload,
} from "@/lib/api/client-route-helpers";

export const dynamic = "force-dynamic";

function optionalInteger(value: string | null) {
  if (value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) ? number : Number.NaN;
}

async function accessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const activeValue = search.get("ativo");
  const limit = optionalInteger(search.get("limit"));
  const offset = optionalInteger(search.get("offset"));

  if (
    (activeValue !== null && activeValue !== "true" && activeValue !== "false") ||
    Number.isNaN(limit) ||
    Number.isNaN(offset) ||
    (limit !== undefined && (limit < 1 || limit > 200)) ||
    (offset !== undefined && offset < 0)
  ) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
  }

  const params: ClientListParams = {
    query: search.get("q")?.trim() || undefined,
    cnpj: search.get("cnpj")?.trim() || undefined,
    active: activeValue === null ? undefined : activeValue === "true",
    limit,
    offset,
  };

  try {
    return NextResponse.json(await listClients(token, params));
  } catch (error) {
    return clientApiErrorResponse("client.list", error);
  }
}

export async function POST(request: NextRequest) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados do cliente inválidos." }, { status: 400 });
  }
  const payload = parseCreateClientPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Dados do cliente inválidos." }, { status: 400 });
  }

  try {
    return NextResponse.json(await createClient(token, payload), { status: 201 });
  } catch (error) {
    return clientApiErrorResponse("client.create", error);
  }
}
