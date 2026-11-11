import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { archiveSimplifiedTemplate, getSimplifiedTemplate, updateSimplifiedTemplate } from "@/lib/api/simplified-issuance";

type Context = { params: Promise<{ id: string; templateId: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { const { id, templateId } = await params; return NextResponse.json(await getSimplifiedTemplate(token, id, templateId)); }
  catch (error) { return clientApiErrorResponse("client.simplified.template", error); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { const { id, templateId } = await params; return NextResponse.json(await updateSimplifiedTemplate(token, id, templateId, await request.json())); }
  catch (error) { return clientApiErrorResponse("client.simplified.template.save", error); }
}
export async function DELETE(_request: NextRequest, { params }: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { const { id, templateId } = await params; await archiveSimplifiedTemplate(token, id, templateId); return new NextResponse(null, { status: 204 }); }
  catch (error) { return clientApiErrorResponse("client.simplified.template.archive", error); }
}
