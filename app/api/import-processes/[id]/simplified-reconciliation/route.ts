import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { getSimplifiedReconciliation, saveSimplifiedLinks } from "@/lib/api/simplified-issuance";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await getSimplifiedReconciliation(token, (await context.params).id)); }
  catch (error) { return importProcessApiErrorResponse("simplified.reconcile.get", error); }
}
export async function PUT(request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || !('links' in payload) || typeof payload.links !== "object" || !payload.links || Array.isArray(payload.links)) return NextResponse.json({ message: "Associações inválidas." }, { status: 400 });
  try { return NextResponse.json(await saveSimplifiedLinks(token, (await context.params).id, payload.links as Record<string, number>)); }
  catch (error) { return importProcessApiErrorResponse("simplified.reconcile.save", error); }
}
