import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { downloadUnnumberedChildXmlBundle } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const snapshotId = new URL(request.url).searchParams.get("duimp_snapshot_id");
  if (!snapshotId) return NextResponse.json({ error: "invalid_payload", message: "Informe a captura da DUIMP usada no plano." }, { status: 400 });
  const { id } = await context.params;
  try {
    const response = await downloadUnnumberedChildXmlBundle(token, id, snapshotId);
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": response.headers["content-disposition"] ?? 'attachment; filename="RASCUNHOS-SEM-NUMERO.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return importProcessApiErrorResponse("import-process.unnumbered-xmls.download", error);
  }
}
