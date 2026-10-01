import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { reconcileNfe } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try {
    return NextResponse.json(await reconcileNfe(token, (await context.params).id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe.sefaz.reconcile", error);
  }
}
