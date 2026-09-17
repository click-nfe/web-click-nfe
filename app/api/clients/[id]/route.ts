import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { getClient, updateClient } from "@/lib/api/client-record";
import {
  clientApiErrorResponse,
  parseUpdateClientPayload,
} from "@/lib/api/client-route-helpers";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function accessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function GET(_request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    return NextResponse.json(await getClient(token, id));
  } catch (error) {
    return clientApiErrorResponse("client.detail", error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
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
  const payload = parseUpdateClientPayload(body);
  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }
  const { id } = await context.params;

  try {
    return NextResponse.json(await updateClient(token, id, payload));
  } catch (error) {
    return clientApiErrorResponse("client.update", error);
  }
}
