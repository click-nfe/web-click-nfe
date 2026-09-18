import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { lookupPostalCode } from "@/lib/api/fiscal-reference";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ zipCode: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const { zipCode } = await context.params;
  try {
    return NextResponse.json(await lookupPostalCode(token, zipCode));
  } catch (error) {
    return clientApiErrorResponse("fiscal-reference.postal-code", error);
  }
}
