import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { updateNfeDraftItem } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id, itemId } = await context.params;
  try {
    return NextResponse.json(await updateNfeDraftItem(token, id, itemId, await request.json()));
  } catch (error) {
    return importProcessApiErrorResponse("nfe-draft.item.update", error);
  }
}
