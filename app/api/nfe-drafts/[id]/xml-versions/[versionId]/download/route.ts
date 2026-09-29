import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { downloadNfeDraftXml } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id, versionId } = await context.params;
  try {
    const response = await downloadNfeDraftXml(token, id, versionId);
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": response.headers["content-disposition"] ?? 'attachment; filename="NFe.xml"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe-draft.xml.download", error);
  }
}
