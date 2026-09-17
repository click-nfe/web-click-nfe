import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { lookupClientCompany } from "@/lib/api/client-record";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ cnpj: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { cnpj } = await context.params;

  try {
    return NextResponse.json(await lookupClientCompany(accessToken, cnpj));
  } catch (error) {
    return clientApiErrorResponse("client.cnpj-lookup", error);
  }
}
