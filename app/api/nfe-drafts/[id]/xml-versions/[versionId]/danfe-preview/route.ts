import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { downloadDanfePreview } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id, versionId } = await context.params;
  try {
    const response = await downloadDanfePreview(token, id, versionId);
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": response.headers["content-disposition"] ?? 'attachment; filename="Previa-DANFE.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe-draft.danfe-preview.download", error);
  }
}
