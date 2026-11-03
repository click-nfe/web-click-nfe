import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { getSimplifiedConfig, saveSimplifiedConfig, type SimplifiedConfig } from "@/lib/api/simplified-issuance";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await getSimplifiedConfig(token, (await context.params).id)); }
  catch (error) { return clientApiErrorResponse("client.simplified.get", error); }
}

export async function PUT(request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const config: unknown = await request.json().catch(() => null);
  if (!config || typeof config !== "object" || Array.isArray(config)) return NextResponse.json({ message: "Configuração inválida." }, { status: 400 });
  try { return NextResponse.json(await saveSimplifiedConfig(token, (await context.params).id, config as SimplifiedConfig)); }
  catch (error) { return clientApiErrorResponse("client.simplified.save", error); }
}
