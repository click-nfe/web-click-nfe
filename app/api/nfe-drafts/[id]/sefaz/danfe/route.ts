import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { downloadAuthorizedDanfe } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try {
    const response = await downloadAuthorizedDanfe(token, (await context.params).id);
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": response.headers["content-disposition"] ?? 'attachment; filename="DANFE-autorizado.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe.sefaz.danfe", error);
  }
}
