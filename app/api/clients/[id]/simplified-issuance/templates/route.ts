import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { createSimplifiedTemplate, listSimplifiedTemplates } from "@/lib/api/simplified-issuance";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await listSimplifiedTemplates(token, (await params).id)); }
  catch (error) { return clientApiErrorResponse("client.simplified.templates", error); }
}
export async function POST(request: NextRequest, { params }: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await createSimplifiedTemplate(token, (await params).id, await request.json()), { status: 201 }); }
  catch (error) { return clientApiErrorResponse("client.simplified.templates.create", error); }
}
