import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { downloadAuthorizedNfe } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try {
    const response = await downloadAuthorizedNfe(token, (await context.params).id);
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": response.headers["content-disposition"] ?? 'attachment; filename="NFe-autorizada.xml"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe.sefaz.authorized-xml", error);
  }
}
