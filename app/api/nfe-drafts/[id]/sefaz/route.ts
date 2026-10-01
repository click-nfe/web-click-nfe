import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNfeSefazStatus } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try {
    return NextResponse.json(await getNfeSefazStatus(token, (await context.params).id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe.sefaz.status", error);
  }
}
