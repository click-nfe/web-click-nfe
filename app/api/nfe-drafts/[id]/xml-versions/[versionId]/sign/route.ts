import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signNfeDraftXml } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; versionId: string }> };

export async function POST(request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const certificateId = payload && typeof payload.certificate_id === "string"
    ? payload.certificate_id : null;
  if (!certificateId) return NextResponse.json({ message: "Selecione um certificado A1 ativo." }, { status: 400 });
  const { id, versionId } = await context.params;
  try {
    const result = await signNfeDraftXml(token, id, versionId, certificateId);
    return NextResponse.json({
      xml_version: {
        id: result.xml_version.id,
        version_number: result.xml_version.version_number,
        xsd_valid: result.xml_version.xsd_valid,
      },
      issuance: result.issuance,
      replayed: result.replayed,
    });
  } catch (error) {
    return importProcessApiErrorResponse("nfe-draft.xml.sign", error);
  }
}
