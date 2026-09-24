import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { validateNfeDraft } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id } = await context.params;
  try {
    return NextResponse.json(await validateNfeDraft(token, id));
  } catch (error) {
    return importProcessApiErrorResponse("nfe-draft.validate", error);
  }
}
