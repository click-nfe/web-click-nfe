import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { validateFiscalCertificate } from "@/lib/api/fiscal-certificate";
import { fiscalCertificateApiErrorResponse } from "@/lib/api/fiscal-certificate-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; certificateId: string }> };

export async function POST(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id, certificateId } = await context.params;
  try {
    return NextResponse.json(
      await validateFiscalCertificate(token, id, certificateId),
    );
  } catch (error) {
    return fiscalCertificateApiErrorResponse("client.certificate.validate", error);
  }
}
